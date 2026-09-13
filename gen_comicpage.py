#!/usr/bin/env python3
"""Generate big, HIGH-QUALITY multi-panel comic PAGES for Chapter 1 — real
comic pages with several characters talking in speech bubbles, not one image
per sentence. Saves studier/images/ch01/page0.jpg, page1.jpg and records them
in studier/images.js as CH_IMAGES["1"].pages."""
import base64
import io
import json
import re
import urllib.request
import urllib.error
from pathlib import Path
from PIL import Image

BASE = Path(__file__).parent
KEY = (BASE / ".openai_key").read_text().strip() if (BASE / ".openai_key").exists() else ""

STYLE = ("A full comic-book PAGE in a warm vintage American-history storybook "
         "style: four panels in a clean 2x2 grid with bold black gutters, thick "
         "clean outlines, a limited palette of parchment cream, navy blue, muted "
         "brick red and brass gold, expressive cartooning. A recurring guide "
         "character appears in every panel — Milo, a short chubby boy with messy "
         "orange hair, big round glasses, a red hoodie and a green backpack. "
         "Characters talk in classic white speech bubbles; keep every bit of "
         "bubble text VERY short, simple and correctly spelled. ")

PAGES = [
    ("page0",
     "Panel 1: Milo gazes up in awe at a vast Native American city of stone "
     "pyramids and grassy earthen mounds; a friendly Native guide beside him "
     "gestures welcomingly with a small speech bubble saying 'Welcome!'. "
     "Panel 2: Milo in a grand European throne room; a crowned king points at a "
     "map with a speech bubble saying 'Find Asia!'. "
     "Panel 3: Milo squished in a busy European market gawking at costly spices; "
     "a merchant holds up a spice with a speech bubble saying 'So pricey!'. "
     "Panel 4: aboard Columbus's small wooden caravel in 1492, a sailor in the "
     "crow's nest shouts with a speech bubble saying 'Land!'; Milo looks seasick. "
     "Lighthearted and warm."),
    ("page1",
     "Panel 1: the Columbian Exchange — crops, a horse, and sailing ships crossing "
     "a wide ocean between two shores; Milo watches quietly and soberly; a "
     "respectful, non-graphic, serious mood, no jokes. "
     "Panel 2: a grand Spanish colonial plaza with a cathedral; a Dominican friar "
     "speaks passionately defending Native people, speech bubble saying 'Be just!'; "
     "Milo stands small nearby; respectful. "
     "Panel 3: Pueblo townspeople joyfully reclaim their sunlit adobe village; "
     "Milo peeks from behind a wall; hopeful and non-graphic. "
     "Panel 4: French and Dutch trappers trade fur with Native partners by a "
     "snowy river fort; Milo is buried under a pile of beaver pelts; a trapper "
     "has a speech bubble saying 'Deal!'; cozy and funny."),
]


def gen(prompt):
    body = {"model": "gpt-image-1", "prompt": prompt, "size": "1024x1536", "quality": "high", "n": 1}
    for attempt in range(3):
        try:
            req = urllib.request.Request(
                "https://api.openai.com/v1/images/generations",
                data=json.dumps(body).encode(),
                headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=300) as r:
                return base64.b64decode(json.loads(r.read())["data"][0]["b64_json"])
        except urllib.error.HTTPError as e:
            print("  HTTP", e.code, e.read().decode()[:160])
            import time
            time.sleep(6 * (attempt + 1))
        except Exception as e:
            print("  err", str(e)[:120])
            import time
            time.sleep(5)
    return None


def save(png, path):
    im = Image.open(io.BytesIO(png)).convert("RGB")
    im.thumbnail((1000, 1500))
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "JPEG", quality=88, optimize=True)


def main():
    if not KEY:
        raise SystemExit("no key")
    out = BASE / "studier" / "images" / "ch01"
    pages = []
    for name, desc in PAGES:
        print("generating", name, "(high quality, this is slow)...")
        png = gen(STYLE + desc)
        if png:
            save(png, out / f"{name}.jpg")
            pages.append(f"images/ch01/{name}.jpg")
            print("  ok", name)
        else:
            print("  FAILED", name)
    # record in manifest
    f = BASE / "studier" / "images.js"
    man = json.loads(re.search(r"window\.CH_IMAGES\s*=\s*(\{[\s\S]*\});", f.read_text()).group(1))
    man.setdefault("1", {})["pages"] = pages
    f.write_text("// AI-generated illustrations per chapter part (built by gen_images.py).\n"
                 "window.CH_IMAGES = " + json.dumps(man, ensure_ascii=False, indent=1) + ";\n")
    print("Done —", len(pages), "pages.")


if __name__ == "__main__":
    main()
