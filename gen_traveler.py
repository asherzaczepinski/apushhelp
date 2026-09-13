#!/usr/bin/env python3
"""Generate chapters featuring THE TRAVELER — one recurring time-traveling teen
in every panel. First makes a character reference, then feeds it into every
strip of the given chapters so the Traveler stays consistent across chapters.
Usage: python3 gen_traveler.py 1 2 3 4"""
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
    "A REAL COMIC-BOOK PAGE STRIP: ONE horizontal image of MULTIPLE panels of EQUAL "
    "size arranged in a clean, even grid, separated by UNIFORM thin cream gutters, "
    "reading left to right. Warm vintage American-history graphic-novel art: thick "
    "confident clean ink outlines, a limited palette of parchment cream, navy blue, "
    "muted brick red and brass gold. Keep BACKGROUNDS SIMPLE, clean and uncluttered — "
    "a few key props and lots of calm flat negative space; avoid busy crowds and "
    "cluttered detail. "
    "CRITICAL TEXT RULE: the image must contain NO narration boxes, captions, labels, "
    "or signs. The ONLY text is at most ONE small white speech bubble per panel with "
    "1-3 correctly-spelled words. Never write sentences in the art. "
)

TRAVELER = (
    "THE TRAVELER is the same recurring teenager shown in the reference image — about "
    "sixteen, warm brown skin, short dark tousled hair, big curious eyes, ALWAYS "
    "wearing a worn leather shoulder satchel, a brass pocket-watch on a chain, and a "
    "rust-red scarf; keep their face and these signature items IDENTICAL to the "
    "reference image, only their era clothing changes. The Traveler appears in EVERY "
    "panel, witnessing or taking part in the event. "
)

REF_PROMPT = (
    "A single CHARACTER REFERENCE portrait in warm vintage graphic-novel comic style: "
    "thick clean ink outlines, limited palette of parchment cream, navy, muted brick "
    "red and brass gold, a plain flat background. A friendly, curious sixteen-year-old "
    "time-traveler with warm brown skin, short dark tousled hair, and big curious eyes, "
    "wearing a worn leather shoulder satchel, a brass pocket-watch on a chain, and a "
    "rust-red scarf over simple clothes. Full figure, neutral standing pose, clear view "
    "of the face and of the satchel, pocket-watch and scarf. No text anywhere."
)


def gen(prompt, aspect, ref_b64=None):
    parts = [{"text": prompt}]
    if ref_b64:
        parts.append({"inlineData": {"mimeType": "image/jpeg", "data": ref_b64}})
    body = {"contents": [{"parts": parts}],
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
    chapters = [int(x) for x in sys.argv[1:]] or [1, 2, 3, 4]
    ref_path = BASE / "studier" / "images" / "traveler_ref.jpg"
    if ref_path.exists():
        ref = base64.b64encode(ref_path.read_bytes()).decode()
        print("using existing traveler_ref.jpg")
    else:
        print("generating Traveler reference...")
        png = gen(REF_PROMPT, "3:4")
        if not png:
            raise SystemExit("reference failed")
        jpg, size = to_jpeg(png, max_w=800)
        ref_path.write_bytes(jpg)
        ref = base64.b64encode(jpg).decode()
        print(f"  ref ok {size}")
    for n in chapters:
        strips = json.loads((SPECS / f"ch{n}.json").read_text())["strips"]
        out = BASE / "studier" / "images" / f"ch{n:02d}"; out.mkdir(parents=True, exist_ok=True)
        print(f"== chapter {n} ==")
        for i, s in enumerate(strips):
            aspect = s.get("aspect", "16:9")
            print(f"  strip{i} ({aspect})...")
            png = gen(STYLE + TRAVELER + "Scene: " + s["scene"], aspect, ref_b64=ref)
            if not png:
                print("    FAILED"); continue
            jpg, size = to_jpeg(png)
            (out / f"strip{i}.jpg").write_bytes(jpg)
            print(f"    ok {size}")
    print("ALL DONE")


if __name__ == "__main__":
    main()
