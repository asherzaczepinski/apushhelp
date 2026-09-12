#!/usr/bin/env python3
"""
Norton ebook text scraper (personal study use).

Opens a real Chrome window, YOU log in with your own account, then the
script pages through the ebook and saves the text of every page so you
can build a study tool from it.

Modes:
  python scraper.py explore   # inspect the reader: frames, text, next-buttons
  python scraper.py scrape    # walk the whole book, save every page's text

Useful flags:
  --url URL             book URL (default: Give Me Liberty! 5 brief)
  --out DIR             output directory (default: output/)
  --next-selector CSS   exact CSS selector for the next-page button
  --frame-hint STR      substring of the content iframe's URL (from explore)
  --arrow-key           page forward with the Right Arrow key instead of clicking
  --delay SECONDS       pause between pages (default 1.0 — be polite)
  --max-pages N         safety cap (default 5000)
  --min-chars N         ignore pages with less text than this (default 80)

Login persists between runs (cookies live in ./chrome_profile), so you
usually only have to log in the first time.
"""

import argparse
import hashlib
import json
import re
import sys
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

BOOK_URL = "https://digital.wwnorton.com/givemeliberty5br"

# Tried in order, in every frame, until one is visible + clickable.
DEFAULT_NEXT_SELECTORS = [
    "#control_next_page",
    "button[aria-label*='next page' i]",
    "a[aria-label*='next page' i]",
    "button[aria-label*='next' i]:not([disabled])",
    "a[aria-label*='next' i]",
    "button[title*='next' i]:not([disabled])",
    "[data-testid*='next']",
    "button.next-page, a.next-page, .btn-next, button.next, a.next",
    "[class*='page-next']:not([class*='disabled'])",
    "[class*='next-btn']:not([class*='disabled'])",
    "[class*='nextBtn']:not([class*='disabled'])",
]

NEXTISH = re.compile(r"next|forward|advance|›|→|»|chevron.?right|arrow.?right", re.I)

# chapter links on the book's contents page (digital.wwnorton.com product page)
PRODUCT_CHAPTER_LINKS = "a.active_activity[data-ebook-chapter]"

# the "Ebook" tile on the product hub page — must be clicked before the
# chapter list loads
EBOOK_TAB = "button.activity_group_selector[data-activity_group*='ebook']"


# ---------------------------------------------------------------- driver

def make_driver(profile_dir):
    opts = Options()
    opts.add_argument(f"--user-data-dir={Path(profile_dir).resolve()}")
    opts.add_argument("--window-size=1400,1000")
    opts.add_argument("--disable-features=TranslateUI")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    return webdriver.Chrome(options=opts)


def wait_for_login(driver, url, auto=False):
    driver.get(url)
    print()
    print("=" * 62)
    print("A Chrome window is open.")
    print("  1. Log in with your Norton account.")
    print("  2. Open the ebook and navigate to the FIRST page you want")
    print("     captured (e.g. Chapter 1, page 1).")
    print("=" * 62)
    if auto or not sys.stdin.isatty():
        wait_for_book(driver)
    else:
        input("Press Enter when the book page is showing... ")
    pick_book_window(driver)


def wait_for_book(driver, timeout=1800, poll=5):
    """No terminal needed: watch the browser until the chapter list (or an
    iframe with real chapter text) shows up, then start."""
    print("Scraping starts AUTOMATICALLY once you're logged in —")
    print("(checking every 5s, 30 min limit)")
    start = time.time()
    hits = 0
    tick = 0
    while time.time() - start < timeout:
        time.sleep(poll)
        tick += 1
        diag = []
        most = 0
        try:
            handles = driver.window_handles
        except Exception as e:
            print(f"  [diag] can't reach browser: {e.__class__.__name__}")
            continue
        for handle in handles:
            try:
                driver.switch_to.window(handle)
                if find_chapter_links_frame(driver) is not None:
                    print("Logged in — chapter list detected. Starting.")
                    return
                if click_ebook_tab(driver):
                    print("  on the product hub — clicked the Ebook tile...")
                    time.sleep(3)
                    if find_chapter_links_frame(driver) is not None:
                        print("Chapter list detected. Starting.")
                        return
                frames = walk_frames(driver, collect_html=False, max_depth=3)
                in_iframes = max((len(f["text"].strip())
                                  for f in frames if f["path"]), default=0)
                most = max(most, in_iframes)
                # fallback: reader that renders without iframes
                top_text = len(frames[0]["text"].strip()) if frames else 0
                if time.time() - start > 180 and top_text > 5000:
                    most = max(most, top_text)
                url = frames[0]["url"] if frames else "?"
                diag.append(f"    window: {url[:70]}  "
                            f"top {top_text:,}ch  iframes {in_iframes:,}ch  "
                            f"chapter-links: none")
            except Exception as e:
                diag.append(f"    window check failed: {e.__class__.__name__}")
        hits = hits + 1 if most >= 800 else 0
        if hits >= 2:
            print("Book detected — starting.")
            return
        if tick % 6 == 0:
            print(f"  [{max(1, int(time.time() - start) // 60)}m] "
                  f"still waiting; what the browser shows:")
            for line in diag:
                print(line)
    raise SystemExit("Gave up after 30 min without seeing the book open.")


def pick_book_window(driver):
    """The reader sometimes opens in a new tab/popup — switch to whichever
    window has the most text in it."""
    best_handle, best_len = None, -1
    for handle in driver.window_handles:
        try:
            driver.switch_to.window(handle)
            frames = walk_frames(driver, collect_html=False)
            total = sum(len(f["text"]) for f in frames)
            if total > best_len:
                best_handle, best_len = handle, total
        except Exception:
            continue
    if best_handle:
        driver.switch_to.window(best_handle)
        print(f"Using window: {driver.title!r}")


# ---------------------------------------------------------------- frames

def walk_frames(driver, collect_html=True, max_depth=4):
    """Visit the page and every (nested) iframe; return a dict per frame:
    {path, url, text, html}. path like [0, 1] = 2nd iframe inside 1st iframe."""
    results = []

    def visit(path, depth):
        try:
            url = driver.execute_script("return location.href") or "?"
        except Exception:
            url = "?"
        try:
            text = driver.execute_script(
                "return document.body ? document.body.innerText : ''") or ""
        except Exception:
            text = ""
        html = ""
        if collect_html:
            try:
                html = driver.execute_script(
                    "return document.documentElement.outerHTML") or ""
            except Exception:
                pass
        results.append({"path": path, "url": url, "text": text, "html": html})
        if depth >= max_depth:
            return
        try:
            count = len(driver.find_elements(By.CSS_SELECTOR, "iframe, frame"))
        except Exception:
            count = 0
        for i in range(count):
            try:
                frames = driver.find_elements(By.CSS_SELECTOR, "iframe, frame")
                driver.switch_to.frame(frames[i])
            except Exception:
                continue
            visit(path + [i], depth + 1)
            try:
                driver.switch_to.parent_frame()
            except Exception:
                return

    driver.switch_to.default_content()
    visit([], 0)
    driver.switch_to.default_content()
    return results


def pick_content(frames, frame_hint=None):
    """The page's actual text = the frame with the most text (optionally
    restricted to frames whose URL contains --frame-hint)."""
    candidates = frames
    if frame_hint:
        hinted = [f for f in frames if frame_hint.lower() in f["url"].lower()]
        if hinted:
            candidates = hinted
    if not candidates:
        return None
    return max(candidates, key=lambda f: len(f["text"].strip()))


def text_hash(text):
    normalized = re.sub(r"\s+", " ", text).strip().lower()
    return hashlib.sha1(normalized.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------- paging

def find_and_click_next(driver, selectors):
    """Try each selector in the page and every frame; JS-click the first
    visible enabled match. Returns a description of what was clicked."""
    result = {"desc": None}

    def try_here(path):
        for sel in selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, sel)
            except Exception:
                continue
            for el in elements:
                try:
                    if el.is_displayed() and el.is_enabled():
                        driver.execute_script("arguments[0].click();", el)
                        result["desc"] = f"{sel}  (frame {path or 'top'})"
                        return True
                except Exception:
                    continue
        return False

    def visit(path, depth):
        if try_here(path):
            return True
        if depth >= 3:
            return False
        try:
            count = len(driver.find_elements(By.CSS_SELECTOR, "iframe, frame"))
        except Exception:
            return False
        for i in range(count):
            try:
                frames = driver.find_elements(By.CSS_SELECTOR, "iframe, frame")
                driver.switch_to.frame(frames[i])
            except Exception:
                continue
            if visit(path + [i], depth + 1):
                return True
            try:
                driver.switch_to.parent_frame()
            except Exception:
                return False
        return False

    driver.switch_to.default_content()
    found = visit([], 0)
    driver.switch_to.default_content()
    return result["desc"] if found else None


def press_arrow_right(driver):
    driver.switch_to.default_content()
    ActionChains(driver).send_keys(Keys.ARROW_RIGHT).perform()


def advance(driver, args):
    if args.arrow_key:
        press_arrow_right(driver)
        return "ArrowRight key"
    selectors = [args.next_selector] if args.next_selector else DEFAULT_NEXT_SELECTORS
    clicked = find_and_click_next(driver, selectors)
    if clicked:
        return clicked
    # last resort: try the keyboard anyway
    press_arrow_right(driver)
    return "ArrowRight key (no next button matched)"


# ---------------------------------------------------------------- scrape

def save_page(out, n, best, seen_hash, manifest, chapter=None, chapter_title=""):
    title = next((ln.strip() for ln in best["text"].splitlines() if ln.strip()), "")[:80]
    txt_path = out / "pages" / f"page_{n:04d}.txt"
    header = (
        f"# page {n}\n"
        f"# chapter: {chapter or '?'} {chapter_title}\n"
        f"# title: {title}\n"
        f"# frame_url: {best['url']}\n\n"
    )
    txt_path.write_text(header + best["text"], encoding="utf-8")
    if best["html"]:
        (out / "html" / f"page_{n:04d}.html").write_text(best["html"], encoding="utf-8")
    manifest["pages"].append({
        "n": n,
        "chapter": chapter,
        "chapter_title": chapter_title,
        "title": title,
        "frame_url": best["url"],
        "chars": len(best["text"]),
        "hash": seen_hash,
        "file": str(txt_path.relative_to(out)),
    })
    (out / "manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"  saved page {n:4d}  ({len(best['text']):6,} chars)  {title!r}")


def write_full_text(out, manifest):
    parts = []
    for page in manifest["pages"]:
        parts.append(f"\n\n{'=' * 70}\n== PAGE {page['n']}: {page['title']}\n{'=' * 70}\n\n")
        body = (out / page["file"]).read_text(encoding="utf-8")
        # drop the 3 header lines
        parts.append(body.split("\n\n", 1)[-1])
    (out / "full_text.txt").write_text("".join(parts), encoding="utf-8")
    print(f"\nWrote {out / 'full_text.txt'} "
          f"({sum(p['chars'] for p in manifest['pages']):,} chars, "
          f"{len(manifest['pages'])} pages)")


def scrape_pages(driver, args, out, manifest, seen, state,
                 chapter=None, chapter_title=""):
    """Capture pages in the current window until the text stops changing."""
    stalls = 0
    while state["n"] < args.max_pages:
        frames = walk_frames(driver, collect_html=True)
        best = pick_content(frames, args.frame_hint)
        if best and len(best["text"].strip()) >= args.min_chars:
            h = text_hash(best["text"])
            if h not in seen:
                seen.add(h)
                state["n"] += 1
                save_page(out, state["n"], best, h, manifest,
                          chapter, chapter_title)
                stalls = 0
        current_hash = text_hash(best["text"]) if best else None

        how = advance(driver, args)

        # wait for the visible text to actually change
        changed = False
        deadline = time.time() + args.page_timeout
        while time.time() < deadline:
            time.sleep(args.delay)
            frames = walk_frames(driver, collect_html=False)
            probe = pick_content(frames, args.frame_hint)
            if probe and text_hash(probe["text"]) != current_hash:
                changed = True
                break

        if not changed:
            stalls += 1
            print(f"  no new text after '{how}' (stall {stalls}/3)")
            if stalls >= 3:
                if chapter:
                    print(f"  chapter {chapter} looks finished.")
                else:
                    print("\nNo new content after 3 tries — assuming end of book.")
                return


def switch_frame_path(driver, path):
    """Switch into the frame at `path` (list of child-frame indexes)."""
    driver.switch_to.default_content()
    for i in path:
        frames = driver.find_elements(By.CSS_SELECTOR, "iframe, frame")
        driver.switch_to.frame(frames[i])


def find_chapter_links_frame(driver, max_depth=3):
    """Search the top document and nested iframes for the chapter links.
    On success returns the frame path AND leaves the driver switched into
    that frame; on failure returns None (driver at default content)."""
    found = {"path": None}

    def visit(path, depth):
        try:
            if driver.find_elements(By.CSS_SELECTOR, PRODUCT_CHAPTER_LINKS):
                found["path"] = path
                return True
        except Exception:
            pass
        if depth >= max_depth:
            return False
        try:
            count = len(driver.find_elements(By.CSS_SELECTOR, "iframe, frame"))
        except Exception:
            return False
        for i in range(count):
            try:
                frames = driver.find_elements(By.CSS_SELECTOR, "iframe, frame")
                driver.switch_to.frame(frames[i])
            except Exception:
                continue
            if visit(path + [i], depth + 1):
                return True
            try:
                driver.switch_to.parent_frame()
            except Exception:
                return False
        return False

    driver.switch_to.default_content()
    if visit([], 0):
        return found["path"]
    driver.switch_to.default_content()
    return None


def click_ebook_tab(driver, max_depth=3):
    """On the product hub page the ebook sits behind a tile button —
    click it so the chapter list loads. Returns True if clicked."""
    clicked = {"ok": False}

    def visit(path, depth):
        try:
            for el in driver.find_elements(By.CSS_SELECTOR, EBOOK_TAB):
                if el.is_displayed():
                    driver.execute_script("arguments[0].click();", el)
                    clicked["ok"] = True
                    return True
        except Exception:
            pass
        if depth >= max_depth:
            return False
        try:
            count = len(driver.find_elements(By.CSS_SELECTOR, "iframe, frame"))
        except Exception:
            return False
        for i in range(count):
            try:
                frames = driver.find_elements(By.CSS_SELECTOR, "iframe, frame")
                driver.switch_to.frame(frames[i])
            except Exception:
                continue
            if visit(path + [i], depth + 1):
                return True
            try:
                driver.switch_to.parent_frame()
            except Exception:
                return False
        return False

    driver.switch_to.default_content()
    visit([], 0)
    driver.switch_to.default_content()
    return clicked["ok"]


def find_product_window(driver):
    """Find (window handle, frame path) showing the chapter links."""
    for handle in driver.window_handles:
        try:
            driver.switch_to.window(handle)
            path = find_chapter_links_frame(driver)
            if path is not None:
                return handle, path
        except Exception:
            continue
    return None


def list_chapters(driver, product):
    handle, path = product
    driver.switch_to.window(handle)
    switch_frame_path(driver, path)
    chapters, seen_nums = [], set()
    for el in driver.find_elements(By.CSS_SELECTOR, PRODUCT_CHAPTER_LINKS):
        num = el.get_attribute("data-ebook-chapter") or ""
        title = el.text.strip()
        if num and num not in seen_nums:
            seen_nums.add(num)
            chapters.append((num, title))
    return chapters


def open_chapter(driver, product, num, reader_handle, book_url):
    """Click a chapter link on the contents page; return the reader window
    handle once that chapter's text is loaded."""
    product_handle, frame_path = product

    # remember what the reader shows now, so we can tell when it changes
    pre_hash = None
    if reader_handle and reader_handle in driver.window_handles:
        driver.switch_to.window(reader_handle)
        best = pick_content(walk_frames(driver, collect_html=False))
        pre_hash = text_hash(best["text"]) if best else None

    try:
        driver.switch_to.window(product_handle)
        switch_frame_path(driver, frame_path)
    except Exception:
        return None
    links = driver.find_elements(
        By.CSS_SELECTOR, f"a.active_activity[data-ebook-chapter='{num}']")
    if not links:
        # contents page may have navigated away — reload it
        driver.switch_to.default_content()
        driver.get(book_url)
        time.sleep(4)
        click_ebook_tab(driver)
        time.sleep(3)
        if find_chapter_links_frame(driver) is None:
            return None
        links = driver.find_elements(
            By.CSS_SELECTOR, f"a.active_activity[data-ebook-chapter='{num}']")
        if not links:
            return None

    before = set(driver.window_handles)
    driver.execute_script("arguments[0].click();", links[0])

    deadline = time.time() + 15
    while time.time() < deadline:
        time.sleep(1)
        fresh = set(driver.window_handles) - before
        if fresh:
            reader_handle = fresh.pop()
            break
        if reader_handle and reader_handle in driver.window_handles:
            break
    if not reader_handle or reader_handle not in driver.window_handles:
        others = [h for h in driver.window_handles if h != product_handle]
        reader_handle = others[-1] if others else product_handle
    driver.switch_to.window(reader_handle)

    # wait for this chapter's text to actually load
    deadline = time.time() + 45
    while time.time() < deadline:
        best = pick_content(walk_frames(driver, collect_html=False))
        if (best and len(best["text"].strip()) >= 300
                and text_hash(best["text"]) != pre_hash):
            break
        time.sleep(2)
    return reader_handle


def scrape(driver, args):
    out = Path(args.out)
    (out / "pages").mkdir(parents=True, exist_ok=True)
    (out / "html").mkdir(parents=True, exist_ok=True)

    manifest = {"book_url": args.url, "pages": []}
    seen = set()
    state = {"n": 0}
    manifest_path = out / "manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        seen = {p["hash"] for p in manifest["pages"]}
        state["n"] = max((p["n"] for p in manifest["pages"]), default=0)
        print(f"Resuming: {state['n']} pages already in {out}/")

    print("\nScraping... (Ctrl-C to stop early; progress is saved as it goes)\n")
    try:
        product = None if args.single else find_product_window(driver)
        if product:
            chapters = list_chapters(driver, product)
            print(f"Found {len(chapters)} chapter links on the contents page.")
            start_at = args.start_chapter
            if not start_at and manifest["pages"]:
                done = [int(p["chapter"]) for p in manifest["pages"]
                        if str(p.get("chapter", "")).isdigit()]
                if done:
                    start_at = max(done)  # redo last (possibly partial) chapter
                    print(f"Resuming from chapter {start_at}.")
            reader = None
            for num, title in chapters:
                if start_at and num.isdigit() and int(num) < start_at:
                    continue
                print(f"\n=== Chapter {num}: {title}")
                reader = open_chapter(driver, product, num, reader, args.url)
                if reader is None:
                    print("  couldn't open this chapter — skipping.")
                    continue
                scrape_pages(driver, args, out, manifest, seen, state,
                             chapter=num, chapter_title=title)
                if state["n"] >= args.max_pages:
                    print("Hit --max-pages cap; stopping.")
                    break
        else:
            pick_book_window(driver)
            scrape_pages(driver, args, out, manifest, seen, state)
    except KeyboardInterrupt:
        print("\nStopped by you.")
    finally:
        if manifest["pages"]:
            write_full_text(out, manifest)
        else:
            print("\nNo pages captured. Run `python scraper.py explore` to "
                  "inspect the reader, then pass --next-selector/--frame-hint.")


# ---------------------------------------------------------------- direct

def js_fetch(driver, url):
    """Fetch a same-origin URL inside the page (cookies included)."""
    driver.set_script_timeout(45)
    return driver.execute_async_script(
        "const url = arguments[0], done = arguments[arguments.length - 1];"
        "fetch(url, {credentials: 'same-origin'})"
        "  .then(r => r.ok ? r.text().then(t => done({ok: true, text: t}))"
        "                  : done({ok: false, status: r.status}))"
        "  .catch(e => done({ok: false, error: String(e)}));", url)


def parse_opf(xml_text, opf_url):
    """Pull the ordered list of content documents out of an EPUB OPF file."""
    from urllib.parse import urljoin
    import xml.etree.ElementTree as ET
    root = ET.fromstring(xml_text.encode("utf-8"))
    items, spine = {}, []
    for el in root.iter():
        tag = el.tag.rsplit("}", 1)[-1]
        if tag == "item":
            items[el.get("id")] = el.get("href")
        elif tag == "itemref":
            spine.append(el.get("idref"))
    urls = []
    for idref in spine:
        href = items.get(idref) or ""
        if href.lower().split("?")[0].endswith((".xhtml", ".html", ".htm")):
            urls.append(urljoin(opf_url, href))
    return urls


def discover_spine(driver, epub_base):
    """Return every content document URL in reading order, via the EPUB's
    own manifest; fall back to chapter1..28.xhtml."""
    from urllib.parse import urljoin
    epub_root = urljoin(epub_base, "../")
    opf_url = None
    res = js_fetch(driver, urljoin(epub_root, "META-INF/container.xml"))
    if res.get("ok"):
        m = re.search(r'full-path="([^"]+)"', res["text"])
        if m:
            opf_url = urljoin(epub_root, m.group(1))
    for cand in filter(None, [opf_url,
                              urljoin(epub_base, "content.opf"),
                              urljoin(epub_base, "package.opf")]):
        res = js_fetch(driver, cand)
        if not res.get("ok"):
            continue
        try:
            urls = parse_opf(res["text"], cand)
        except Exception:
            continue
        if urls:
            print(f"Spine found via {cand.rsplit('/', 1)[-1]} — "
                  f"{len(urls)} documents.")
            return urls
    print("No OPF manifest reachable — falling back to chapter1..28.xhtml")
    return [urljoin(epub_base, f"chapter{i}.xhtml") for i in range(1, 29)]


def direct(driver, args):
    """Load each EPUB content document directly and save its full text."""
    out = Path(args.out)
    (out / "pages").mkdir(parents=True, exist_ok=True)
    (out / "html").mkdir(parents=True, exist_ok=True)
    manifest = {"book_url": args.url, "pages": []}
    seen = set()
    n = 0

    docs = discover_spine(driver, args.epub_base)
    print(f"Fetching {len(docs)} documents...\n")
    for url in docs:
        name = url.rsplit("/", 1)[-1]
        try:
            driver.get(url)
            # wait for the rendered text length to stop growing
            prev = -1
            deadline = time.time() + 30
            while time.time() < deadline:
                cur = driver.execute_script(
                    "return document.body ? document.body.innerText.length : 0")
                if cur > 0 and cur == prev:
                    break
                prev = cur
                time.sleep(0.7)
            text = driver.execute_script(
                "return document.body ? document.body.innerText : ''") or ""
            html = driver.execute_script(
                "return document.documentElement.outerHTML") or ""
        except Exception as e:
            print(f"  FAILED {name}: {e.__class__.__name__}")
            continue
        if len(text.strip()) < args.min_chars:
            print(f"  skipped {name} (only {len(text.strip())} chars)")
            continue
        h = text_hash(text)
        if h in seen:
            continue
        seen.add(h)
        m = re.search(r"chapter\s*0*(\d+)", name, re.I)
        n += 1
        save_page(out, n, {"url": url, "text": text, "html": html},
                  h, manifest, m.group(1) if m else None,
                  (driver.title or name).strip())
        time.sleep(args.delay)

    if manifest["pages"]:
        write_full_text(out, manifest)
    else:
        print("No documents captured — the epub URLs may be protected. "
              "Use scrape mode instead.")


# ---------------------------------------------------------------- explore

def suggest_selector(el):
    el_id = el.get_attribute("id")
    if el_id:
        return f"#{el_id}"
    classes = (el.get_attribute("class") or "").split()
    if classes:
        return f"{el.tag_name}.{classes[0]}"
    aria = el.get_attribute("aria-label")
    if aria:
        return f"{el.tag_name}[aria-label='{aria}']"
    return el.tag_name


def list_next_candidates(driver):
    """Print anything clickable that smells like a next-page control,
    in the top document and every frame."""
    def scan(path):
        found = []
        try:
            elements = driver.find_elements(
                By.CSS_SELECTOR, "button, a, [role='button']")
        except Exception:
            return found
        for el in elements:
            try:
                if not el.is_displayed():
                    continue
                label = " | ".join(filter(None, [
                    el.text.strip()[:40],
                    el.get_attribute("aria-label") or "",
                    el.get_attribute("title") or "",
                    el.get_attribute("class") or "",
                    el.get_attribute("id") or "",
                ]))
                if NEXTISH.search(label):
                    found.append((path, suggest_selector(el), label[:110]))
            except Exception:
                continue
        return found

    all_found = []

    def visit(path, depth):
        all_found.extend(scan(path))
        if depth >= 3:
            return
        try:
            count = len(driver.find_elements(By.CSS_SELECTOR, "iframe, frame"))
        except Exception:
            return
        for i in range(count):
            try:
                frames = driver.find_elements(By.CSS_SELECTOR, "iframe, frame")
                driver.switch_to.frame(frames[i])
            except Exception:
                continue
            visit(path + [i], depth + 1)
            try:
                driver.switch_to.parent_frame()
            except Exception:
                return

    driver.switch_to.default_content()
    visit([], 0)
    driver.switch_to.default_content()

    if not all_found:
        print("  (no obvious next-page controls found — the reader may use "
          "the Right Arrow key: try `scrape --arrow-key`)")
    for path, sel, label in all_found:
        print(f"  frame {str(path) or '[]':>8}  {sel:<40}  {label}")


def explore(driver, args):
    dumps = Path(args.out) / "explore_dumps"
    dumps.mkdir(parents=True, exist_ok=True)
    snap = 0
    print("\nExplore mode — flip around the book in Chrome, then use:")
    print("  Enter  snapshot: show every frame + how much text it holds")
    print("  b      list candidate next-page buttons/links")
    print("  d      dump every frame's full HTML to", dumps)
    print("  q      quit\n")
    while True:
        cmd = input("explore> ").strip().lower()
        if cmd == "q":
            return
        if cmd == "b":
            list_next_candidates(driver)
            continue
        pick_book_window(driver)
        frames = walk_frames(driver, collect_html=(cmd == "d"))
        best = pick_content(frames, args.frame_hint)
        print(f"\n  window title: {driver.title!r}")
        for f in frames:
            marker = "  <-- most text (content?)" if f is best else ""
            preview = re.sub(r"\s+", " ", f["text"])[:70]
            print(f"  frame {str(f['path']) or '[]':>8}  "
                  f"{len(f['text']):7,} chars  {f['url'][:60]}{marker}")
            if preview:
                print(f"           {preview!r}")
        if cmd == "d":
            snap += 1
            for i, f in enumerate(frames):
                if f["html"]:
                    p = dumps / f"snap{snap:02d}_frame{i}.html"
                    p.write_text(f["html"], encoding="utf-8")
            print(f"  dumped {len(frames)} frames to {dumps}/snap{snap:02d}_*")
        print()


# ---------------------------------------------------------------- main

def main():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("mode", choices=["explore", "scrape", "direct"])
    parser.add_argument(
        "--epub-base",
        default="https://digital.wwnorton.com/ebooks/epub/givemeliberty5br/OEBPS/",
        help="base URL of the book's EPUB content documents (direct mode)")
    parser.add_argument("--url", default=BOOK_URL)
    parser.add_argument("--out", default="output")
    parser.add_argument("--profile", default="chrome_profile")
    parser.add_argument("--next-selector", default=None)
    parser.add_argument("--frame-hint", default=None)
    parser.add_argument("--arrow-key", action="store_true")
    parser.add_argument("--auto", action="store_true",
                        help="don't wait for Enter; start when the book is detected")
    parser.add_argument("--single", action="store_true",
                        help="ignore the chapter list; just page from the current spot")
    parser.add_argument("--start-chapter", type=int, default=None,
                        help="skip chapters below this number")
    parser.add_argument("--delay", type=float, default=1.0)
    parser.add_argument("--page-timeout", type=float, default=12.0,
                        help="seconds to wait for the page text to change")
    parser.add_argument("--min-chars", type=int, default=80)
    parser.add_argument("--max-pages", type=int, default=5000)
    args = parser.parse_args()

    driver = make_driver(args.profile)
    try:
        wait_for_login(driver, args.url, auto=args.auto)
        if args.mode == "explore":
            explore(driver, args)
        elif args.mode == "direct":
            direct(driver, args)
        else:
            scrape(driver, args)
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
