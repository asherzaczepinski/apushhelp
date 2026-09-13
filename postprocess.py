#!/usr/bin/env python3
"""Post-process strip images: (1) trim the solid-color outer border so the art
goes edge-to-edge, and (2) bake the date badge into the top-left corner of the
image itself. Reads each strip's date from output/comic_specs/ch<N>.json.
Usage:
  python3 postprocess.py test          -> process a couple to /tmp for review
  python3 postprocess.py all           -> process every strip IN PLACE
  python3 postprocess.py <n> [n ...]   -> process the given chapters IN PLACE
"""
import sys
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageChops

BASE = Path(__file__).parent
SPECS = BASE / "output" / "comic_specs"
INK = (43, 33, 24)          # #2b2118
PARCH = (245, 236, 215)     # #f5ecd7
BRASS = (139, 111, 71)      # #8b6f47

FONT_PATHS = [
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "/Library/Fonts/Georgia.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]


def find_font(sz):
    for p in FONT_PATHS:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, sz)
            except Exception:
                pass
    return ImageFont.load_default()


def trim_border(im, thresh=34):
    """Trim the near-uniform outer border (cream frame) using the corner color.
    Pure PIL: build a solid image of the border color, diff, threshold, getbbox."""
    W, H = im.size
    bg = Image.new("RGB", im.size, im.getpixel((0, 0)))
    diff = ImageChops.difference(im, bg).convert("L")
    # zero out anything within `thresh` of the border color, keep the rest
    mask = diff.point(lambda p: 255 if p > thresh else 0)
    bbox = mask.getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    # safety: if it wants to trim more than 15% of a side, treat as no clean border
    if (r - l) < W * 0.7 or (b - t) < H * 0.7:
        return im
    return im.crop(bbox)


def stamp_date(im, text):
    d = ImageDraw.Draw(im)
    W = im.size[0]
    sz = max(13, W // 58)          # small, unobtrusive
    f = find_font(sz)
    bb = d.textbbox((0, 0), text, font=f)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    padx, pady = 6, 4
    x0, y0 = 8, 8
    x1, y1 = x0 + tw + padx * 2, y0 + th + pady * 2
    d.rectangle([x0, y0, x1, y1], fill=INK, outline=BRASS, width=2)
    d.text((x0 + padx - bb[0], y0 + pady - bb[1]), text, font=f, fill=PARCH)
    return im


def process(src, date, dst):
    im = Image.open(src).convert("RGB")
    im = trim_border(im)
    im = stamp_date(im, date)
    im.save(dst, "JPEG", quality=90, optimize=True)
    return im.size


def dates_for(n):
    strips = json.loads((SPECS / f"ch{n}.json").read_text())["strips"]
    return [s.get("date", "") for s in strips]


def do_chapter(n, inplace=True, outdir=None):
    d = BASE / "studier" / "images" / f"ch{n:02d}"
    dates = dates_for(n)
    for i, dt in enumerate(dates):
        src = d / f"strip{i}.jpg"
        if not src.exists():
            continue
        dst = src if inplace else Path(outdir) / f"pp_ch{n}_{i}.jpg"
        process(src, dt, dst)
    print(f"ch{n}: processed {len(dates)} strips" + ("" if inplace else f" -> {outdir}"))


def main():
    arg = sys.argv[1] if len(sys.argv) > 1 else "test"
    if arg == "test":
        for n, i in [(2, 0), (8, 0)]:
            dt = dates_for(n)[i]
            sz = process(BASE / "studier" / "images" / f"ch{n:02d}" / f"strip{i}.jpg",
                         dt, Path("/tmp") / f"pp_ch{n}_{i}.jpg")
            print(f"ch{n} strip{i} ({dt}) -> /tmp/pp_ch{n}_{i}.jpg  {sz}")
    elif arg == "all":
        for n in range(1, 29):
            if (SPECS / f"ch{n}.json").exists():
                do_chapter(n, inplace=True)
    else:
        for a in sys.argv[1:]:
            do_chapter(int(a), inplace=True)


if __name__ == "__main__":
    main()
