#!/usr/bin/env python3
"""Test: an illustrated BASE map (North America + Atlantic rim, comic style) plus
one per-segment version for each Chapter 1 strip, marked up with that segment's
places/arrows. Base is generated once, then fed back as a reference so every
segment map shares the same base. Saves studier/images/base_map.jpg and
studier/images/ch01/map0..5.jpg."""
import base64
import io
import json
import time
import urllib.request
import urllib.error
from pathlib import Path
from PIL import Image

BASE = Path(__file__).parent
KEY = (BASE / ".gemini_key").read_text().strip()
MODEL = "gemini-3.1-flash-image"

MAPSTYLE = (
    "A hand-drawn ILLUSTRATED MAP in warm vintage American-history graphic-novel "
    "style to match a comic book: aged parchment-cream background, thick clean navy "
    "ink coastlines, land tinted soft brass-gold and muted olive, a pale blue ocean "
    "with faint line hatching, a small decorative compass rose, an elegant thin "
    "border. Any labels must be SHORT, in clean hand-lettered UPPERCASE, and "
    "correctly spelled. "
)

BASE_PROMPT = (
    MAPSTYLE +
    "Show NORTH AMERICA centered — Canada, the future United States with its Atlantic "
    "coast, Mexico and Central America, and the Caribbean islands — with the northern "
    "edge of South America at the bottom, and the far western coasts of Europe and "
    "West Africa small at the RIGHT edge across a wide labeled Atlantic Ocean. Keep it "
    "clean and uncluttered with NO place labels and NO arrows, leaving open room for "
    "later annotations. Elegant, balanced, cartographic."
)

REF = ("Use the reference image as the EXACT base map — keep the same coastlines, "
       "colors, parchment style and layout identical. Only ADD the following "
       "annotations, drawn in the same navy/brick-red/brass ink style: ")

SEGMENTS = [
    # (filename, added-annotations)
    ("map0",
     "small brick-red star markers with short labels — 'AZTEC' in central Mexico, "
     "'INCA' on the Andes at the bottom, 'CAHOKIA' on the mid-Mississippi, 'PUEBLO' in "
     "the Southwest, 'IROQUOIS' in the Northeast woodlands. A small banner reading "
     "'MANY NATIONS'. No arrows."),
    ("map1",
     "a navy dashed arrow that starts at the right edge (Europe), curves down along the "
     "West African coast, then sweeps across the Atlantic toward the Caribbean; a small "
     "marker 'PORTUGAL' at the right edge, 'WEST AFRICA' below it, and a tiny sugar-"
     "island dot. A banner reading 'THE OCEAN ROUTE'."),
    ("map2",
     "a brick-red star on a Caribbean island labeled '1492'; TWO big curved arrows "
     "across the Atlantic — one navy arrow pointing EAST toward Europe labeled 'CORN "
     "POTATOES', and one brass arrow pointing WEST toward the Americas labeled 'HORSES "
     "WHEAT'. A banner reading 'THE EXCHANGE'."),
    ("map3",
     "brick-red X marks with short labels 'AZTEC' in central Mexico and 'INCA' on the "
     "Andes; a heavy navy arrow of conquest sweeping from the Caribbean into Mexico and "
     "down toward Peru. A banner reading 'CONQUEST'."),
    ("map4",
     "shade Mexico, the far Southwest and Florida in a soft brass tint; add small cross "
     "markers labeled 'MEXICO CITY', 'SANTA FE' (Southwest) and 'ST. AUGUSTINE' "
     "(Florida). A banner reading 'NEW SPAIN'."),
    ("map5",
     "a brick-red starburst in the Southwest labeled 'PUEBLO REVOLT 1680'; a navy marker "
     "at the St. Lawrence 'QUEBEC' and one on the Hudson 'NEW NETHERLAND'; small brass "
     "fur-trade arrows near the Great Lakes. A banner reading 'RIVALS'."),
]


def gen(prompt, ref_b64=None, aspect="4:3"):
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
    ch = BASE / "studier" / "images" / "ch01"; ch.mkdir(parents=True, exist_ok=True)
    print("base map...")
    png = gen(BASE_PROMPT)
    if not png:
        raise SystemExit("base map failed")
    base_jpg, size = to_jpeg(png)
    (BASE / "studier" / "images" / "base_map.jpg").write_bytes(base_jpg)
    print(f"  base ok {size}")
    ref = base64.b64encode(base_jpg).decode()
    for name, ann in SEGMENTS:
        print(f"{name}...")
        p = MAPSTYLE + REF + ann
        png = gen(p, ref_b64=ref)
        if not png:
            print("  FAILED"); continue
        jpg, size = to_jpeg(png)
        (ch / f"{name}.jpg").write_bytes(jpg)
        print(f"  ok {size}")
    print("Done.")


if __name__ == "__main__":
    main()
