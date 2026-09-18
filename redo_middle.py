#!/usr/bin/env python3
"""Regenerate specific middle timeline images and run them through the same
normalize pipeline (magenta->white key, flood-fill bg removal, trim, feather,
webp) so they match every other timeline picture. Targets are (webp_path, prompt).
Usage: python3 redo_middle.py
"""
import base64, io, json, time, shutil, urllib.request, urllib.error
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

BASE = Path(__file__).parent
KEY = (BASE / ".gemini_key").read_text().strip()
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

# (target webp path, subject prompt)
TARGETS = [
    ("studier/images/ch22tl/e22_2.webp", "a jubilant American crowd celebrating V-E Day, cheering and waving hats and American flags in a city street, confetti in the air — NO enemy flag"),
]

def gen(prompt):
    body = {"contents": [{"parts": [{"text": STYLE + prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "1:1"}}}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"
    for a in range(9):
        try:
            req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=300) as r:
                data = json.loads(r.read())
            for part in data["candidates"][0]["content"]["parts"]:
                if "inlineData" in part:
                    return base64.b64decode(part["inlineData"]["data"])
            print("    no image; retry"); time.sleep(4)
        except urllib.error.HTTPError as e:
            print("    HTTP", e.code, "waiting"); time.sleep(15 * (a + 1))
        except Exception as e:
            print("    err", str(e)[:120]); time.sleep(6)
    return None

def key_magenta(im):
    im = im.convert("RGB"); px = im.load(); W, H = im.size
    for y in range(H):
        for x in range(W):
            r, g, b = px[x, y]
            if r > 115 and b > 105 and g < r - 45 and g < b - 40:
                px[x, y] = (255, 255, 255)
    return im

def normalize_to_webp(im, out_path):
    im = im.convert("RGB"); w, h = im.size
    flood = im.copy()
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(flood, seed, (255, 0, 255), thresh=32)
    arr = np.asarray(flood)
    is_bg = (arr[:, :, 0] == 255) & (arr[:, :, 1] == 0) & (arr[:, :, 2] == 255)
    alpha = Image.fromarray(np.where(is_bg, 0, 255).astype("uint8"), "L").filter(ImageFilter.GaussianBlur(1.4))
    rgba = im.convert("RGBA"); rgba.putalpha(alpha)
    bbox = alpha.getbbox()
    if bbox:
        l, t, r, b = bbox
        rgba = rgba.crop((max(0, l - 6), max(0, t - 6), min(w, r + 6), min(h, b + 6)))
    W2, H2 = rgba.size
    if max(W2, H2) > 640:
        s = 640 / max(W2, H2); rgba = rgba.resize((round(W2 * s), round(H2 * s)), Image.LANCZOS)
    rgba.save(out_path, "WEBP", quality=80, method=4)

def main():
    prev_dir = BASE / "studier" / "_prev"
    mf = prev_dir / "manifest.json"
    manifest = json.loads(mf.read_text()) if mf.exists() else []
    for path, prompt in TARGETS:
        print(f"\n== {path}\n   {prompt}")
        full = BASE / path
        rel = path[len("studier/"):]                 # images/chNNtl/eX_Y.webp
        # snapshot the version we're about to replace
        if full.exists():
            dest = prev_dir / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(full, dest)
        raw = gen(prompt)
        if not raw:
            print("   FAILED to generate"); continue
        im = key_magenta(Image.open(io.BytesIO(raw)))
        normalize_to_webp(im, str(full))
        manifest = [m for m in manifest if m["path"] != rel]
        manifest.append({"path": rel, "prev": "_prev/" + rel, "prompt": prompt})
        print("   saved.")
    prev_dir.mkdir(parents=True, exist_ok=True)
    mf.write_text(json.dumps(manifest, indent=2))

if __name__ == "__main__":
    main()
