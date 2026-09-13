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
    "confident ink outlines and rich color — of the described subject FULLY ISOLATED "
    "on a completely plain PURE WHITE #FFFFFF background, like a clean cut-out sticker "
    "with NOTHING behind it: no scenery, no backdrop, no shadow on the floor, no border "
    "or frame, only flat pure white all around the subject. Center the subject and fill "
    "the frame. NO text, letters, numbers, labels or speech bubbles anywhere. Subject: "
)


class CreditsOut(Exception):
    pass


def gen(prompt, aspect="1:1"):
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"],
                                 "imageConfig": {"aspectRatio": aspect}}}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"
    for a in range(5):
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
            if "deplet" in body.lower() or "prepay" in body.lower() or "billing" in body.lower():
                raise CreditsOut()
            print("    HTTP", e.code, body[:160]); time.sleep(8 * (a + 1))
        except Exception as e:
            print("    err", str(e)[:120]); time.sleep(5)
    return None


def to_jpeg(png, max_w=900):
    im = Image.open(io.BytesIO(png)).convert("RGB")
    if im.width > max_w:
        im.thumbnail((max_w, max_w))
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
        print("!! CREDITS DEPLETED — stopping cleanly. Re-run to resume after topping up.")
        return
    print("ALL DONE")


if __name__ == "__main__":
    main()
