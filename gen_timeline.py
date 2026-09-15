#!/usr/bin/env python3
"""Illustrated-timeline images: each concept/event demonstrated as isolated
cut-out art on a PURE WHITE (#FFFFFF) background so it can be composited /
replaced later. Reads output/comic_specs/ch<N>_timeline.json:
  [ {"date","title","prompts":[p0,p1,p2]}, ... ]
Saves studier/images/ch<NN>tl/e<i>_<j>.jpg. Resumable (skips existing).
Usage: python3 gen_timeline.py 1"""
import base64
import io
import json
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from PIL import Image

BASE = Path(__file__).parent
KEY = (BASE / ".gemini_key").read_text().strip()
SPECS = BASE / "output" / "comic_specs"
MODEL = "gemini-3.1-flash-image"

STYLE = (
    "A single warm vintage American-history graphic-novel illustration — thick clean "
    "confident ink outlines and rich color — of the described subject as a COMPACT "
    "VIGNETTE centered on a SOLID UNIFORM BRIGHT MAGENTA (#FF00FF) chroma-key screen. "
    "The magenta fills the whole background with a clear magenta margin all around the "
    "subject; the subject must NOT touch the edges and must NEVER be a full-bleed scene. "
    "NO scenery, NO white or grey background, and NO border, frame, outline, sticker "
    "edge, drop shadow or halo around the subject — nothing but the subject and flat "
    "solid magenta everywhere else. NO text, letters, numbers, labels or speech bubbles "
    "anywhere. Subject: "
)


def key_magenta(im):
    """Replace the magenta chroma screen (and its fringe) with pure white."""
    im = im.convert("RGB")
    px = im.load(); W, H = im.size
    for y in range(H):
        for x in range(W):
            r, g, b = px[x, y]
            if r > 115 and b > 105 and g < r - 45 and g < b - 40:   # magenta / magenta-fringe
                px[x, y] = (255, 255, 255)
    return im


class CreditsOut(Exception):
    pass


def gen(prompt, aspect="1:1"):
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"],
                                 "imageConfig": {"aspectRatio": aspect}}}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"
    for a in range(9):
        try:
            req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                         headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=300) as r:
                data = json.loads(r.read())
            for part in data["candidates"][0]["content"]["parts"]:
                if "inlineData" in part:
                    return base64.b64decode(part["inlineData"]["data"])
            print("    no image; retry"); time.sleep(4)
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            low = body.lower()
            # ONLY true prepay-credit depletion stops the run; a plain rate-limit 429
            # ("exceeded your current quota") just needs a wait.
            if "deplet" in low or "prepayment" in low or "per_day" in low or "requests_per_model_per_day" in low:
                raise CreditsOut()     # out of credits OR hit the 1000/day cap → stop cleanly
            print("    HTTP", e.code, "(rate limit — waiting)" if e.code == 429 else body[:120])
            time.sleep(15 * (a + 1))   # back off through per-minute rate limits
        except Exception as e:
            print("    err", str(e)[:120]); time.sleep(6)
    return None


def to_jpeg(png, max_w=900):
    im = Image.open(io.BytesIO(png)).convert("RGB")
    if im.width > max_w:
        im.thumbnail((max_w, max_w))
    im = key_magenta(im)   # magenta screen -> pure white (blends into parchment)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=90, optimize=True)
    return buf.getvalue(), im.size


def main():
    chapters = [int(x) for x in sys.argv[1:]] or [1]
    try:
        for n in chapters:
            spec = SPECS / f"ch{n}_timeline.json"
            if not spec.exists():
                print(f"ch{n}: NO SPEC, skip"); continue
            entries = json.loads(spec.read_text())
            out = BASE / "studier" / "images" / f"ch{n:02d}tl"; out.mkdir(parents=True, exist_ok=True)
            print(f"===== CHAPTER {n} ({len(entries)} entries) =====")
            for i, e in enumerate(entries):
                print(f"[{i}] {e['date']} — {e['title']}")
                for j, p in enumerate(e["prompts"]):
                    dest = out / f"e{i}_{j}.jpg"
                    if dest.exists():
                        continue
                    png = gen(STYLE + p)
                    if not png:
                        print(f"    {j}: FAILED"); continue
                    jpg, size = to_jpeg(png)
                    dest.write_bytes(jpg)
                    print(f"    {j}: ok")
            print(f"ch{n} DONE")
    except CreditsOut:
        print("!! STOPPED — out of credits OR hit the 1000-images/day cap. Re-run after a top-up or the daily reset.")
        return
    print("ALL DONE")


if __name__ == "__main__":
    main()
