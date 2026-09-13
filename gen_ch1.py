#!/usr/bin/env python3
"""Chapter 1 as REAL comic strips: 6 stacked images, each one strip with
DIFFERENT-SIZED panels reading left-to-right, following WINONA (a Native woman
and warrior) with Mateo for the Europe cutaways. Gemini Flash image model, with
character-reference chaining so Winona stays consistent across strips.
Saves studier/images/ch01/strip0..5.jpg."""
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

STYLE = (
    "A REAL COMIC-BOOK PAGE STRIP: ONE horizontal image containing MULTIPLE panels "
    "of DIFFERENT sizes (for example one large panel beside two smaller stacked "
    "panels), divided by clean thin cream gutters, a dynamic professional comic "
    "layout that reads left to right. Warm vintage American-history graphic-novel "
    "art: thick confident clean ink outlines, a rich limited palette of parchment "
    "cream, navy blue, muted brick red and brass gold, dramatic cinematic lighting, "
    "expressive faces. Characters may speak in classic white comic speech bubbles; "
    "keep any bubble text VERY short, simple and correctly spelled. Do NOT draw any "
    "narration caption boxes; no letters or numbers anywhere except the short speech "
    "bubbles. "
)

WINONA = (
    "WINONA is a young Native American woman with long black braided hair, warm brown "
    "eyes, high cheekbones, a fringed tan buckskin dress, a turquoise-and-bone beaded "
    "necklace, and a wooden bow slung across her back — dignified, strong, brave, a "
    "warrior, drawn respectfully and never as a caricature. "
)
MATEO = (
    "MATEO is a young European sailor about eighteen with short wavy brown hair, a "
    "loose off-white linen shirt, a brown leather vest and a red knitted cap. "
)
REF = ("Keep WINONA's face, hair, necklace and buckskin dress IDENTICAL to the young "
       "Native woman with the bow shown in the reference image; only the scene changes. ")

# (filename, aspect, uses_winona_reference, scene)
STRIPS = [
    ("strip0", "16:9", False, WINONA +
     "THREE panels of different sizes. LARGE LEFT PANEL: Winona stands on a green rise "
     "at dawn overlooking a thriving Native world — a busy farming village, distant "
     "earthen mounds and adobe towns under a huge sky. TOP-RIGHT SMALL PANEL: Winona and "
     "other Native women harvest a shared cornfield together, smiling; Winona's speech "
     "bubble: 'We share it all.' BOTTOM-RIGHT SMALL PANEL: a montage of many Native "
     "nations — an Aztec pyramid, a Cahokia earthen mound, cliffside Pueblo dwellings, an "
     "Iroquois longhouse. Peaceful and proud."),

    ("strip1", "16:9", False, MATEO +
     "THREE panels of different sizes. TALL LEFT PANEL: a rigid European town — a lord on "
     "a raised dais and a bishop, with peasants kneeling; young Mateo stands stiffly in "
     "line, cap in hand; the lord's speech bubble: 'Obey.' TOP-RIGHT PANEL: Mateo in a "
     "market stares at costly Asian spices and silk while a merchant taps a map; "
     "merchant's speech bubble: 'Reach Asia.' BOTTOM-RIGHT WIDE PANEL, somber and muted: a "
     "small Portuguese caravel sails along the distant African coast past island sugar "
     "fields; Mateo uneasy at the rail; no speech bubble."),

    ("strip2", "3:2", True, WINONA + MATEO + REF +
     "THREE panels of different sizes. BIG DRAMATIC TOP PANEL: the year 1492 — three "
     "Spanish sailing ships reach a bright sunlit Caribbean shore, sails full; Mateo in "
     "the rigging points to land; his speech bubble: 'Land!' BOTTOM-LEFT PANEL: first "
     "contact on a beach — Winona and Mateo stand a few careful steps apart, wary; "
     "Winona's hand rests on her bow. BOTTOM-RIGHT PANEL: a clean circular DIAGRAM of the "
     "Columbian Exchange — one curved arrow sweeps corn, potatoes and a tobacco leaf one "
     "way, the opposite curved arrow sweeps a horse, wheat and sugar cane the other way, "
     "forming a full circle; simple drawn icons only, NO words."),

    ("strip3", "16:9", True, WINONA + REF +
     "THREE panels of different sizes, somber and respectful, non-graphic, no gore. TALL "
     "LEFT PANEL: Winona kneels alone in her quiet emptied village at dusk, head bowed in "
     "grief as European disease empties the land. TOP-RIGHT PANEL: a Spanish conquistador "
     "in steel armor on horseback with a banner before a great toppled stone city. "
     "BOTTOM-RIGHT PANEL: Winona stands defiant with her bow drawn, resisting, jaw set; "
     "her speech bubble: 'No more.'"),

    ("strip4", "16:9", True, WINONA + REF +
     "THREE panels of different sizes. LARGE LEFT PANEL: a grand Spanish colonial city — a "
     "huge stone cathedral over a busy plaza; in the foreground Native laborers, including "
     "Winona, work under a watching overseer; dignified and weary, respectful. TOP-RIGHT "
     "PANEL: a Dominican friar stands before seated Spanish officials, one hand raised in "
     "protest; his speech bubble: 'Unjust!' BOTTOM-RIGHT PANEL: a warm marketplace where a "
     "blended Spanish-and-Native mestizo family shops, with a small adobe desert mission "
     "church behind them."),

    ("strip5", "3:2", True, WINONA + REF +
     "THREE panels of different sizes. BIG DYNAMIC LOW-ANGLE TOP PANEL: the 1680 Pueblo "
     "Revolt — Winona leads her people rising up to reclaim their sunlit adobe town, one "
     "fist raised high; her speech bubble: 'Our home!'; triumphant, spirited, non-graphic. "
     "BOTTOM-LEFT PANEL, cozy winter snow: at a wooden fort by a frozen river a French "
     "trapper and Winona trade thick beaver furs as partners; trapper's speech bubble: "
     "'Partners.' BOTTOM-RIGHT PANEL: closing — Winona stands on a shore at golden hour "
     "looking out at tall sailing ships crossing the Atlantic; reflective and resolute."),
]


def gen(scene, aspect, ref_b64=None):
    parts = [{"text": STYLE + "Scene: " + scene}]
    if ref_b64:
        parts.append({"inlineData": {"mimeType": "image/jpeg", "data": ref_b64}})
    body = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"],
                             "imageConfig": {"aspectRatio": aspect}},
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"
    for a in range(4):
        try:
            req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                         headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=300) as r:
                data = json.loads(r.read())
            for part in data["candidates"][0]["content"]["parts"]:
                if "inlineData" in part:
                    return base64.b64decode(part["inlineData"]["data"])
            print("  no image; retry"); time.sleep(4)
        except urllib.error.HTTPError as e:
            print("  HTTP", e.code, e.read().decode()[:160]); time.sleep(6 * (a + 1))
        except Exception as e:
            print("  err", str(e)[:120]); time.sleep(5)
    return None


def to_jpeg(png, max_w=1200):
    im = Image.open(io.BytesIO(png)).convert("RGB")
    if im.width > max_w:
        im.thumbnail((max_w, max_w * 3))
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=90, optimize=True)
    return buf.getvalue(), im.size


def main():
    out = BASE / "studier" / "images" / "ch01"; out.mkdir(parents=True, exist_ok=True)
    winona_ref = None
    for name, aspect, use_ref, scene in STRIPS:
        print(f"{name} ({aspect})...")
        png = gen(scene, aspect, ref_b64=winona_ref if use_ref else None)
        if not png:
            print("  FAILED"); continue
        jpg, size = to_jpeg(png)
        (out / f"{name}.jpg").write_bytes(jpg)
        print(f"  ok {size}")
        if name == "strip0":  # establish Winona reference from the first strip
            winona_ref = base64.b64encode(jpg).decode()
    print("Done.")


if __name__ == "__main__":
    main()
