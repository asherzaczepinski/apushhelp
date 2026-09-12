#!/usr/bin/env python3
"""Generate a cartoon/graphic-novel illustration for each part of a chapter
using the OpenAI image API. Key is read from ./.openai_key (gitignored) or
$OPENAI_API_KEY — never hard-coded, never committed. Images are saved as
small JPEGs under studier/images/chNN/ and indexed in studier/images.js.

Usage:
  python gen_images.py --chapter 1            # whole chapter
  python gen_images.py --chapter 1 --only 1   # just a test image
"""
import argparse
import base64
import io
import json
import re
import sys
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from threading import Lock

from PIL import Image

BASE = Path(__file__).parent
KEY = (BASE / ".openai_key").read_text().strip() if (BASE / ".openai_key").exists() \
    else __import__("os").environ.get("OPENAI_API_KEY", "")

STYLE = ("Flat vector cartoon illustration in a warm vintage American-history "
         "storybook style: thick clean outlines, limited palette of parchment "
         "cream, navy blue, muted brick red and brass gold, soft flat shading, "
         "playful and a little goofy but tasteful, single clear centered subject "
         "on a simple background. Absolutely NO text, letters, numbers or words "
         "anywhere in the image. Keep it respectful, symbolic and non-graphic — "
         "no violence, gore, or depictions of suffering. ")

MAP_STYLE = ("A stylized vintage illustrated MAP in a warm storybook style: "
             "parchment background, navy-blue sea, brass-gold coastlines, a small "
             "compass rose, recognizable continents and coastlines, with a bold "
             "muted-red marker or dotted route showing WHERE the event happened so "
             "the geography is instantly clear. Flat, clean, slightly playful. "
             "Absolutely NO text, letters, numbers or words anywhere. Respectful "
             "and non-graphic. Depict: ")

lock = Lock()


def api_image(prompt):
    """Return raw PNG bytes for a prompt, or None. Tries gpt-image-1, then dall-e-3."""
    attempts = [
        {"model": "gpt-image-1", "prompt": prompt, "size": "1024x1024", "quality": "low", "n": 1},
        {"model": "dall-e-3", "prompt": prompt, "size": "1024x1024", "quality": "standard",
         "response_format": "b64_json", "n": 1},
    ]
    last = ""
    for body in attempts:
        for retry in range(3):
            try:
                req = urllib.request.Request(
                    "https://api.openai.com/v1/images/generations",
                    data=json.dumps(body).encode(),
                    headers={"Authorization": "Bearer " + KEY,
                             "Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=180) as r:
                    data = json.loads(r.read())
                b64 = data["data"][0].get("b64_json")
                if b64:
                    return base64.b64decode(b64)
            except urllib.error.HTTPError as e:
                last = e.read().decode()[:300]
                if e.code == 429:  # rate limited — wait and retry
                    import time
                    time.sleep(8 * (retry + 1))
                    continue
                break  # other errors: try next model
            except Exception as e:
                last = str(e)[:200]
                import time
                time.sleep(4)
        # break inner loop -> next model
    with lock:
        print("    ! failed:", last)
    return None


def save_jpg(png_bytes, path):
    im = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    im.thumbnail((640, 640))
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "JPEG", quality=82, optimize=True)


def build_items(ch, c):
    # each item: (category, index, filename, subject, style)  style: "cartoon" | "map"
    items = []
    items.append(("cover", 0, "cover",
                  f"A dramatic graphic-novel cover scene for the U.S. history chapter "
                  f"'{c['title']}' ({c.get('years','')}). Iconic, dynamic, storybook.", "cartoon"))
    for i, p in enumerate(c.get("summary", [])):
        items.append(("summary", i, f"summary{i}", "A comic-book panel illustrating this moment: " + p[:220], "cartoon"))
    for i, b in enumerate(c.get("big_ideas", [])):
        items.append(("ideas", i, f"idea{i}", "An illustration of the idea: " + b[:200], "cartoon"))
    for i, t in enumerate(c.get("key_terms", [])):
        items.append(("terms", i, f"term{i}",
                      f"An illustration of '{t['term']}': " + t["def"][:170], "cartoon"))
    for i, e in enumerate(c.get("timeline", [])):
        items.append(("timeline", i, f"time{i}",
                      f"the geographic setting of this {e['year']} event — " + e["event"][:170]
                      + " — mark on the map where it took place.", "map"))
    for i, th in enumerate(c.get("themes", [])):
        items.append(("themes", i, f"theme{i}", "A symbolic illustration of the theme: " + th[:200], "cartoon"))
    return items


def load_manifest():
    f = BASE / "studier" / "images.js"
    if f.exists():
        m = re.search(r"window\.CH_IMAGES\s*=\s*(\{[\s\S]*\});?\s*$", f.read_text())
        if m:
            try:
                return json.loads(m.group(1))
            except Exception:
                pass
    return {}


def write_manifest(man):
    (BASE / "studier" / "images.js").write_text(
        "// AI-generated illustrations per chapter part (built by gen_images.py).\n"
        "window.CH_IMAGES = " + json.dumps(man, ensure_ascii=False, indent=1) + ";\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chapter", type=int, default=1)
    ap.add_argument("--only", type=int, default=0, help="generate only the first N items (test)")
    ap.add_argument("--workers", type=int, default=2)
    args = ap.parse_args()

    if not KEY:
        sys.exit("No API key found (.openai_key or OPENAI_API_KEY).")

    ch = args.chapter
    cfile = BASE / "output" / "summaries" / f"ch{ch:02d}.json"
    c = json.loads(cfile.read_text())
    items = build_items(ch, c)
    if args.only:
        items = items[:args.only]

    outdir = BASE / "studier" / "images" / f"ch{ch:02d}"
    man = load_manifest()
    chman = man.get(str(ch), {})

    print(f"Chapter {ch}: generating {len(items)} images ({args.workers} at a time)...")
    done = [0]

    def one(item):
        cat, idx, name, subject, style = item
        path = outdir / f"{name}.jpg"
        rel = f"images/ch{ch:02d}/{name}.jpg"
        if path.exists():
            store(chman, cat, idx, rel)
            with lock:
                done[0] += 1
                print(f"  [{done[0]}/{len(items)}] cached {name}")
            return
        prefix = MAP_STYLE if style == "map" else STYLE
        png = api_image(prefix + subject)
        if png:
            try:
                save_jpg(png, path)
                store(chman, cat, idx, rel)
            except Exception as e:
                with lock:
                    print("    ! save error", e)
        with lock:
            done[0] += 1
            print(f"  [{done[0]}/{len(items)}] {'ok ' if png else 'skip'} {name}")
            man[str(ch)] = chman
            write_manifest(man)

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        list(ex.map(one, items))

    man[str(ch)] = chman
    write_manifest(man)
    print("Done. Wrote studier/images.js")


def store(chman, cat, idx, rel):
    with lock:
        if cat == "cover":
            chman["cover"] = rel
        else:
            arr = chman.setdefault(cat, [])
            while len(arr) <= idx:
                arr.append(None)
            arr[idx] = rel


if __name__ == "__main__":
    main()
