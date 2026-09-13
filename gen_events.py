#!/usr/bin/env python3
"""Single richly-detailed illustration per beat — ONE image (no panel grid), no
recurring character, just the historical event. Driven by each strip's caption.
Consistent style, 3:2. Usage: python3 gen_events.py 1 [2 ...]"""
import base64
import io
import json
import re
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
ASPECT = "3:2"

STYLE = (
    "A SINGLE richly detailed comic-book illustration of ONE scene — NOT a grid, with "
    "NO panels and NO gutters, one full image. Warm vintage American-history graphic-"
    "novel art: thick clean confident ink outlines, lavish detail, a rich palette of "
    "parchment cream, navy blue, muted brick red and brass gold, dramatic cinematic "
    "lighting, expressive faces, and a full, atmospheric, historically accurate period "
    "setting. Depict the REAL historical people and place of the moment — NO modern, "
    "cartoon, or recurring characters. NO narration text, captions, labels or signs "
    "anywhere; at most ONE small speech bubble of 1-3 correctly-spelled words. "
)


def subject(cap):
    """Strip markdown bold; use the caption as the scene brief."""
    return re.sub(r"\*\*(.+?)\*\*", r"\1", cap)


def gen(prompt):
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"],
                                 "imageConfig": {"aspectRatio": ASPECT}}}
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
            print("    HTTP", e.code, e.read().decode()[:160]); time.sleep(8 * (a + 1))
        except Exception as e:
            print("    err", str(e)[:120]); time.sleep(5)
    return None


def to_jpeg(png, max_w=1200):
    im = Image.open(io.BytesIO(png)).convert("RGB")
    if im.width > max_w:
        im.thumbnail((max_w, max_w * 3))
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=90, optimize=True)
    return buf.getvalue(), im.size


def main():
    chapters = [int(x) for x in sys.argv[1:]] or [1]
    for n in chapters:
        strips = json.loads((SPECS / f"ch{n}.json").read_text())["strips"]
        out = BASE / "studier" / "images" / f"ch{n:02d}"; out.mkdir(parents=True, exist_ok=True)
        print(f"== chapter {n} ==")
        for i, s in enumerate(strips):
            dest = out / f"strip{i}.jpg"
            if dest.exists():
                print(f"  img{i}: exists, skip"); continue
            print(f"  img{i}...")
            prompt = STYLE + "Illustrate the single most iconic image of this moment in U.S. history: " + subject(s["cap"])
            png = gen(prompt)
            if not png:
                print("    FAILED"); continue
            jpg, size = to_jpeg(png)
            (out / f"strip{i}.jpg").write_bytes(jpg)
            print(f"    ok {size}")
    print("ALL DONE")


if __name__ == "__main__":
    main()
