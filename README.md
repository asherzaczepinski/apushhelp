# Norton ebook scraper

Pulls the text of every page of your *Give Me Liberty!* (5th brief ed.)
ebook on digital.wwnorton.com so you can build a study tool from it.

You log in with **your own Norton account** in a real Chrome window — the
script only automates turning pages and saving the text. Keep the output
for your own studying; don't redistribute the book text.

## One-time setup

```bash
cd ~/Desktop/apushhelp
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

(Already done if Claude set this up for you.)

## Scrape the book

```bash
.venv/bin/python scraper.py scrape
```

1. Chrome opens on the book's page. Log in, open the ebook, and go to the
   **first page you want captured** (e.g. Chapter 1).
2. Come back to the terminal and press **Enter**.
3. It saves each page and clicks "next" until the text stops changing
   (3 stalls in a row = end of book). `Ctrl-C` stops early — everything
   captured so far is already on disk.

Your login is remembered in `chrome_profile/`, so future runs skip the
login step. Re-running `scrape` **resumes**: pages already captured are
skipped by content, so just navigate to where you left off first.

## Output

```
output/
  pages/page_0001.txt   one file per page (with title + source URL header)
  html/page_0001.html   raw HTML of the content frame (backup for re-parsing)
  full_text.txt         the whole book concatenated, with page separators
  manifest.json         page list: number, title, char count, file
```

## If it doesn't page through correctly

Run explore mode to see how the reader is built:

```bash
.venv/bin/python scraper.py explore
```

- **Enter** — shows every iframe and how much text each holds; the one
  marked `<-- most text` is what scrape mode captures.
- **b** — lists everything that looks like a next-page button, with a
  suggested CSS selector.
- **d** — dumps every frame's HTML to `output/explore_dumps/` (paste one
  back to Claude to get exact selectors figured out).

Then re-run scrape with what you found:

```bash
# exact next button:
.venv/bin/python scraper.py scrape --next-selector "#pageRight"

# reader responds to arrow keys instead of a button:
.venv/bin/python scraper.py scrape --arrow-key

# wrong frame being captured — pin it by a piece of its URL:
.venv/bin/python scraper.py scrape --frame-hint "epub"
```

Other knobs: `--delay 2` (slower/politer), `--page-timeout 20` (slow
pages), `--max-pages 200` (test run), `--out mybook` (different folder).

## Troubleshooting

- **"user data directory is already in use"** — a leftover Chrome from a
  previous run is still open; quit it (or `pkill -f chrome_profile`).
- **Chrome/driver errors on first run** — Selenium auto-downloads the
  right chromedriver; it needs Google Chrome installed and one-time
  network access.
- **Captures the same page twice / skips pages** — pages are deduped by
  text content, so duplicates are harmless; if it skips, raise
  `--page-timeout`.
