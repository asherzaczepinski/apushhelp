#!/usr/bin/env python3
"""Normalize studier illustrations so subjects line up and backgrounds vanish.

For each image:
  1. Flood-fill the OUTER background (white or a flat color) starting from the
     four corners -> transparent. Corner-seeded so whites INSIDE the art
     (flag stripes, clothing) are kept.
  2. Trim to the subject's bounding box (removes the random margin that made
     subjects float at different sizes).
  3. Feather the alpha edge a hair so the cut fades softly into the parchment.
  4. Save as PNG (JPG can't hold transparency).

Usage:
  python3 normalize_images.py --sample           # process a few, into images_norm_test/
  python3 normalize_images.py --all              # process every image in-place-ish (writes .png next to .jpg)
"""
import sys, os, glob
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

THRESH = 32        # how close to the corner color still counts as background
FEATHER = 1.4      # gaussian blur radius on the alpha edge
PAD = 6            # px of breathing room kept around the trimmed subject
SENTINEL = (255, 0, 255)

def normalize(path, out_path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    flood = im.copy()
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(flood, seed, SENTINEL, thresh=THRESH)
    arr = np.asarray(flood)
    is_bg = (arr[:, :, 0] == 255) & (arr[:, :, 1] == 0) & (arr[:, :, 2] == 255)
    alpha = np.where(is_bg, 0, 255).astype("uint8")

    rgba = im.convert("RGBA")
    a_img = Image.fromarray(alpha, "L")
    # feather the edge so it fades into the page instead of a hard cut
    if FEATHER:
        a_img = a_img.filter(ImageFilter.GaussianBlur(FEATHER))
    rgba.putalpha(a_img)

    bbox = a_img.getbbox()               # tight box around everything still opaque
    if bbox:
        l, t, r, b = bbox
        l = max(0, l - PAD); t = max(0, t - PAD)
        r = min(w, r + PAD); b = min(h, b + PAD)
        rgba = rgba.crop((l, t, r, b))
    rgba.save(out_path)
    return rgba.size

SAMPLES = [
    "studier/images/ch28tl/e25_0.jpg",   # US-Cuba handshake (flags, interior whites)
    "studier/images/ch01tl/e0_0.jpg",    # farmers scene (wide subject)
    "studier/images/ch28/comic0.jpg",
    "studier/images/ch09/idea0.jpg",
]

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root)
    mode = sys.argv[1] if len(sys.argv) > 1 else "--sample"
    if mode == "--sample":
        out = "images_norm_test"
        os.makedirs(out, exist_ok=True)
        for i, p in enumerate(SAMPLES):
            if not os.path.exists(p):
                print("skip (missing):", p); continue
            o = os.path.join(out, f"sample{i}.png")
            sz = normalize(p, o)
            print(f"{p}  ->  {o}   trimmed to {sz}")
        print("\nDone. Open the compare page to eyeball it.")
    elif mode == "--timeline":
        files = sorted(glob.glob("studier/images/*tl/*.jpg"))
        print(f"processing {len(files)} timeline images...")
        for n, p in enumerate(files, 1):
            o = p[:-4] + ".png"
            try:
                normalize(p, o)
            except Exception as e:
                print("ERR", p, e)
            if n % 200 == 0:
                print(f"  {n}/{len(files)}")
        print("done.")

if __name__ == "__main__":
    main()
