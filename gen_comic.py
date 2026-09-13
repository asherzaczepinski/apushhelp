#!/usr/bin/env python3
"""Chapter 1 as a ~20-panel follow-along story tracking TWO recurring
characters — Aiyana (a young Native American woman) and Mateo (a young European
sailor) — whose worlds meet. Concepts like the Columbian Exchange are shown as
diagrams. High quality. Saves studier/images/ch01/story0..19.jpg."""
import base64
import io
import json
import urllib.request
import urllib.error
from pathlib import Path
from PIL import Image

BASE = Path(__file__).parent
KEY = (BASE / ".openai_key").read_text().strip() if (BASE / ".openai_key").exists() else ""

STYLE = ("A single high-quality COMIC-BOOK PANEL, square, warm vintage "
         "American-history graphic-novel style: thick confident clean outlines, "
         "rich limited palette of parchment cream, navy blue, muted brick red and "
         "brass gold, dramatic lighting, professional composition. Characters may "
         "speak in ONE classic white speech bubble; keep bubble text VERY short, "
         "simple and correctly spelled. No other text, letters or numbers. ")

AIYANA = ("AIYANA is a young Native American woman with long black braided hair, "
          "warm brown eyes, a simple fringed tan buckskin dress and a beaded "
          "necklace — dignified and kind, drawn respectfully, never a caricature. ")
MATEO = ("MATEO is a young European sailor about eighteen with short wavy brown "
         "hair, a loose off-white linen shirt, a brown vest and a red knitted cap. ")
CONSISTENT = "Keep both characters looking EXACTLY the same in every panel they appear. "

P = [
    (AIYANA, "ESTABLISHING WIDE SHOT: Aiyana stands on a green rise overlooking a thriving Native world — a busy farming village, and in the distance stone pyramids and grassy earthen mounds under a huge sky. Warm and wondrous."),
    (AIYANA, "MEDIUM SHOT: Aiyana and other Native women tend a shared cornfield together, smiling and passing baskets of harvest; a sense of community. Aiyana's speech bubble: 'We share it all.'"),
    (AIYANA, "ASPECT MONTAGE PANEL split into quarters: an Aztec pyramid city, a Cahokia earthen mound town, cliffside Pueblo dwellings, and an Iroquois longhouse village — the huge variety of Native nations. Small Aiyana in a corner gesturing across them."),
    (MATEO, "FORMAL MEDIUM SHOT: a rigid European town — a lord on a raised dais and a bishop, with peasants kneeling; young Mateo stands stiffly in line, cap in hand. The lord's speech bubble: 'Know your place.'"),
    (MATEO, "TIGHT CLOSE-UP: Mateo in a cramped market stares wide-eyed at costly Asian spices and silk on a merchant's table; the merchant taps a map. Merchant's speech bubble: 'Reach Asia!'"),
    (MATEO, "WIDE SOMBER SHOT at dusk: a small Portuguese caravel sails along the distant African coast; on a far island, rows of sugar cane; Mateo stands uneasy at the rail. Muted, somber, respectful, non-graphic, no speech bubble."),
    (MATEO, "BIG DRAMATIC HERO PANEL: 1492 — three Spanish sailing ships reach a bright sunlit Caribbean shore, sails full; young Mateo in the rigging points to land. Speech bubble: 'Land!'. Epic and cinematic."),
    (AIYANA + MATEO + CONSISTENT, "MEDIUM SHOT: first contact on a beach — Aiyana and Mateo stand a few careful steps apart, facing each other with wary curiosity, small groups of their people behind each of them."),
    ("", "CLEAN INFOGRAPHIC-STYLE DIAGRAM PANEL: a big circular exchange diagram. One thick curved arrow sweeps New-World foods — corn, potatoes, tomatoes, a tobacco leaf — one way; the opposite curved arrow sweeps Old-World items — a horse, a cow, wheat, sugar cane — the other way; the two arrows join into a full clockwise circle in the center. Simple bold drawn icons, no words, parchment background."),
    (AIYANA, "SOMBER RESPECTFUL SHOT: Aiyana kneels alone in her quiet, emptied village at dusk, head bowed in grief; a heavy, mournful mood; non-graphic, no bodies, nothing gory."),
    (AIYANA, "DRAMATIC WIDE SHOT (non-graphic): a Spanish conquistador in steel armor on horseback with a banner before a great toppled stone city, Native allied warriors alongside him; Aiyana watches from the side, somber. No violence or gore."),
    ("", "WIDE SHOT: a grand Spanish colonial city — a huge stone cathedral over a busy plaza, tiled roofs, crowds. Urban and imposing."),
    (AIYANA, "MEDIUM SOMBER SHOT: Native laborers, including Aiyana, work a colonial field under a watching Spanish overseer; dignified and weary; respectful and non-graphic."),
    ("", "MEDIUM SHOT: a Dominican friar in robes stands before seated Spanish officials, one hand raised, passionately defending Native people. Friar's speech bubble: 'This is unjust!'"),
    ("", "WARM MEDIUM SHOT: a lively colonial marketplace where a blended Spanish-and-Native (mestizo) family shops — mixed clothing, foods and faces; a hopeful, hybrid culture."),
    ("", "MEDIUM SHOT: a small adobe Spanish mission church in a sunny desert (Santa Fe, New Mexico) with a friar and Pueblo people nearby; a little coastal fort visible in a small inset corner (Florida)."),
    (AIYANA, "DYNAMIC TILTED ACTION SHOT: the Pueblo Revolt of 1680 — Pueblo townspeople joyfully rise and reclaim their sunlit adobe town, one person raising a fist. Speech bubble: 'Our home!'. Hopeful, spirited, non-graphic."),
    (AIYANA, "COZY WINTER WIDE SHOT in falling snow: at a small wooden fort by a frozen river (Quebec), a French trapper and Aiyana trade thick beaver furs. Trapper's speech bubble: 'Partners.'"),
    (AIYANA, "MEDIUM SHOT: Aiyana and a Dutch trader shake hands as equals over a bundle of furs at a riverside trading post (New Netherland); mutual respect."),
    (AIYANA + MATEO + CONSISTENT, "CLOSING WIDE THEMATIC SHOT: Aiyana and Mateo stand side by side on a shore at golden hour, looking out at sailing ships crossing the Atlantic between two continents; reflective and bittersweet."),
]


def gen(prompt):
    body = {"model": "gpt-image-1", "prompt": prompt, "size": "1024x1024", "quality": "high", "n": 1}
    for a in range(3):
        try:
            req = urllib.request.Request("https://api.openai.com/v1/images/generations",
                data=json.dumps(body).encode(),
                headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=300) as r:
                return base64.b64decode(json.loads(r.read())["data"][0]["b64_json"])
        except urllib.error.HTTPError as e:
            print("  HTTP", e.code, e.read().decode()[:140]); import time; time.sleep(6 * (a + 1))
        except Exception as e:
            print("  err", str(e)[:120]); import time; time.sleep(5)
    return None


def save(png, path):
    im = Image.open(io.BytesIO(png)).convert("RGB"); im.thumbnail((820, 820))
    im.save(path, "JPEG", quality=88, optimize=True)


def main():
    if not KEY:
        raise SystemExit("no key")
    out = BASE / "studier" / "images" / "ch01"; out.mkdir(parents=True, exist_ok=True)
    for i, (chars, desc) in enumerate(P):
        print(f"panel {i}...")
        png = gen(STYLE + chars + "Scene: " + desc)
        if png:
            save(png, out / f"story{i}.jpg"); print("  ok")
        else:
            print("  FAILED")
    print(f"Done — {len(P)} story panels.")


if __name__ == "__main__":
    main()
