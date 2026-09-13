#!/usr/bin/env python3
"""Generate comic-strip images for chapters 2-28 from the authored specs in
output/comic_specs/ch<N>.json. Gemini Flash image model, per-chapter Winona
reference chaining. Resumable: skips strips whose jpg already exists.
Usage: python3 gen_all.py [chapter ...]   (default: all with a spec json)"""
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
    "A REAL COMIC-BOOK PAGE STRIP: ONE horizontal image containing MULTIPLE panels "
    "of DIFFERENT sizes divided by clean thin cream gutters, a dynamic professional "
    "comic layout that reads left to right. Warm vintage American-history graphic-"
    "novel art: thick confident clean ink outlines, a rich limited palette of "
    "parchment cream, navy blue, muted brick red and brass gold, dramatic cinematic "
    "lighting, expressive faces. Characters may speak in classic white comic speech "
    "bubbles; keep any bubble text VERY short (1-3 words), simple and correctly "
    "spelled. Do NOT draw narration caption boxes; no letters or numbers anywhere "
    "except the short speech bubbles. "
)
WINONA_CORE = (
    "WINONA is the SAME recurring Native American woman throughout the series — warm "
    "brown eyes, high cheekbones, dark hair, calm and strong. Keep her face clearly "
    "consistent with the reference image; her clothing and gear match this era. "
)


def gen(scene, aspect, ref_b64=None):
    text = STYLE + (WINONA_CORE if ref_b64 else "") + "Scene: " + scene
    parts = [{"text": text}]
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
            msg = e.read().decode()[:160]
            print("    HTTP", e.code, msg); time.sleep(8 * (a + 1))
        except Exception as e:
            print("    err", str(e)[:120]); time.sleep(5)
    return None


def to_jpeg(png, max_w=1200):
    im = Image.open(io.BytesIO(png)).convert("RGB")
    if im.width > max_w:
        im.thumbnail((max_w, max_w * 3))
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=90, optimize=True)
    return buf.getvalue(), im.size


def do_chapter(n):
    spec_path = SPECS / f"ch{n}.json"
    if not spec_path.exists():
        print(f"ch{n}: NO SPEC, skip"); return
    try:
        spec = json.loads(spec_path.read_text())
        strips = spec["strips"]
        assert len(strips) == 6
    except Exception as e:
        print(f"ch{n}: BAD SPEC ({e}), skip"); return
    out = BASE / "studier" / "images" / f"ch{n:02d}"; out.mkdir(parents=True, exist_ok=True)
    winona_ref = None
    print(f"== chapter {n} ==")
    for i, s in enumerate(strips):
        dest = out / f"strip{i}.jpg"
        aspect = s.get("aspect", "16:9")
        if aspect not in ("16:9", "3:2", "4:3", "3:4", "1:1", "21:9"):
            aspect = "16:9"
        has_w = bool(s.get("has_winona"))
        if dest.exists():
            print(f"  strip{i}: exists, skip")
            if has_w and winona_ref is None:
                jpg = dest.read_bytes(); winona_ref = base64.b64encode(jpg).decode()
            continue
        print(f"  strip{i} ({aspect}, winona={has_w})...")
        png = gen(s["scene"], aspect, ref_b64=winona_ref if has_w else None)
        if not png:
            print("    FAILED"); continue
        jpg, size = to_jpeg(png)
        dest.write_bytes(jpg)
        print(f"    ok {size}")
        if has_w and winona_ref is None:
            winona_ref = base64.b64encode(jpg).decode()


def main():
    if len(sys.argv) > 1:
        chapters = [int(x) for x in sys.argv[1:]]
    else:
        chapters = sorted(int(p.stem[2:]) for p in SPECS.glob("ch*.json")
                          if p.stem[2:].isdigit())
    for n in chapters:
        do_chapter(n)
    print("ALL DONE")


if __name__ == "__main__":
    main()
