#!/usr/bin/env python3
"""Regenerate Chapter 1's comic panels as a GOOD comic — one high-quality panel
per story point (so every point is hit), with a recurring cast, speech bubbles,
and deliberate shot direction (Scott McCloud: vary the shot, one hero panel,
quiet grim beats). Overwrites comic0..9.jpg."""
import base64
import io
import json
import urllib.request
import urllib.error
from pathlib import Path
from PIL import Image

BASE = Path(__file__).parent
KEY = (BASE / ".openai_key").read_text().strip() if (BASE / ".openai_key").exists() else ""

STYLE = ("A single high-quality COMIC-BOOK PANEL, square, in a warm vintage "
         "American-history graphic-novel style: thick confident clean outlines, "
         "rich limited palette of parchment cream, navy blue, muted brick red and "
         "brass gold, dramatic lighting and expressive, well-composed staging like "
         "a professional comic. Recurring guide character in most panels: Milo, a "
         "short chubby boy with messy orange hair, big round glasses, a red hoodie "
         "and a green backpack — keep him EXACTLY consistent. Characters may speak "
         "in one classic white speech bubble; keep bubble text VERY short, simple "
         "and correctly spelled. No other text, letters or numbers anywhere. ")

PANELS = [
    "ESTABLISHING WIDE SHOT: a sweeping panorama of several thriving Native American civilizations at once — a great stone pyramid city, grassy earthen mounds, cliffside pueblo dwellings — under a huge sky. Milo stands tiny in the foreground with arms raised in awe; a friendly Native guide beside him sweeps a hand across the land, speech bubble: 'So many nations!'. Wondrous and warm.",
    "MEDIUM SHOT: Native women tend a shared cornfield in a village; Milo sheepishly lowers a little wooden 'mine' sign as a kind woman gestures to the open land, speech bubble: 'We share it.'. Gentle and warm.",
    "FORMAL SYMMETRIC MEDIUM SHOT: a stiff ornate European throne room, a stern crowned king seated high with a bishop beside him and subjects kneeling; Milo bows awkwardly far too low. King's speech bubble: 'Obey me.'. Rigid, imposing composition.",
    "TIGHT CLOSE-UP over a table: a European merchant's hands spread a map toward Asia beside costly spices and silk; Milo peeks over the edge clutching one tiny coin, eyes huge. Merchant's speech bubble: 'Reach Asia!'. Detailed and close.",
    "QUIET WIDE SHOT at dusk: a small Portuguese caravel sails along a distant African coastline; Milo stands alone at the rail, subdued and uneasy, gazing out. Muted, somber, respectful. NO comedy, no violence, non-graphic, no speech bubble.",
    "BIG DRAMATIC HERO PANEL: the pivotal moment — Columbus's three ships reach a sunlit Caribbean shore in 1492, sails full, dramatic sky and light; a lookout points and shouts, speech bubble 'Land ho!'; Milo grips the rail looking seasick but amazed. Epic and cinematic.",
    "SPLIT ASPECT SHOT: across a wide ocean, corn and a horse and a sailing ship pass between two shores (the Columbian Exchange); Milo watches quietly and soberly from a corner. Serious, respectful, quiet mood, symbolic and non-graphic, no jokes, no speech bubble.",
    "MEDIUM SHOT: a grand Spanish colonial plaza with a stone cathedral; a Dominican friar in robes stands and speaks passionately with one hand raised, speech bubble 'Be just!'; Milo listens nearby in a mixed crowd. Respectful, warm light.",
    "DYNAMIC TILTED ACTION SHOT: Pueblo townspeople joyfully rise up and reclaim their sunlit adobe village (the Pueblo Revolt), full of hopeful energy; one raises a fist, speech bubble 'Our home!'; Milo peeks wide-eyed from behind a wall. Spirited and non-graphic.",
    "COZY WIDE SHOT in gentle falling snow: French and Dutch trappers trade thick beaver furs with Native partners beside a small wooden fort and a frozen river; Milo is comically buried under a huge pile of pelts with only his glasses poking out; a trapper's speech bubble: 'Deal!'. Warm and funny.",
]


def gen(prompt):
    body = {"model": "gpt-image-1", "prompt": prompt, "size": "1024x1024", "quality": "high", "n": 1}
    for attempt in range(3):
        try:
            req = urllib.request.Request(
                "https://api.openai.com/v1/images/generations",
                data=json.dumps(body).encode(),
                headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=300) as r:
                return base64.b64decode(json.loads(r.read())["data"][0]["b64_json"])
        except urllib.error.HTTPError as e:
            print("  HTTP", e.code, e.read().decode()[:140]); import time; time.sleep(6 * (attempt + 1))
        except Exception as e:
            print("  err", str(e)[:120]); import time; time.sleep(5)
    return None


def save(png, path):
    im = Image.open(io.BytesIO(png)).convert("RGB")
    im.thumbnail((800, 800))
    im.save(path, "JPEG", quality=88, optimize=True)


def main():
    if not KEY:
        raise SystemExit("no key")
    out = BASE / "studier" / "images" / "ch01"
    out.mkdir(parents=True, exist_ok=True)
    for i, desc in enumerate(PANELS):
        print(f"panel {i} (high quality)...")
        png = gen(STYLE + "Scene: " + desc)
        if png:
            save(png, out / f"comic{i}.jpg"); print("  ok")
        else:
            print("  FAILED")
    print("Done — Chapter 1 comic regenerated (high quality, every point).")


if __name__ == "__main__":
    main()
