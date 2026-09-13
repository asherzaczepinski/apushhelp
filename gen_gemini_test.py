#!/usr/bin/env python3
"""Bake-off: generate the same Chapter-1 comic STRIP on two Gemini image models
so we can compare quality vs price. Saves to /tmp/gem_<model>.jpg."""
import base64
import io
import json
import sys
import urllib.request
import urllib.error
from pathlib import Path
from PIL import Image

BASE = Path(__file__).parent
KEY = (BASE / ".gemini_key").read_text().strip()

STYLE = (
    "A REAL COMIC STRIP: one horizontal image divided into 3 equal panels left to "
    "right, separated by thin clean cream gutters, like a page from a graphic novel. "
    "Warm vintage American-history graphic-novel art: thick confident clean ink "
    "outlines, a rich limited palette of parchment cream, navy blue, muted brick red "
    "and brass gold, dramatic cinematic lighting, professional composition. Characters "
    "speak in classic white comic speech bubbles; keep bubble text VERY short, simple "
    "and correctly spelled. No other text, captions, letters or numbers anywhere. "
)

AIYANA = (
    "AIYANA is a young Native American woman with long black braided hair, warm brown "
    "eyes, a fringed tan buckskin dress, a beaded necklace, and a wooden bow slung "
    "across her back — dignified, strong and kind, a warrior, drawn respectfully and "
    "never as a caricature. Keep her looking EXACTLY the same in all three panels. "
)

STRIP = (
    "PANEL 1 (establishing wide shot): Aiyana stands on a green rise at dawn "
    "overlooking her thriving Native world — a busy farming village with earthen mounds "
    "and distant adobe towns under a huge sky; peaceful and proud. "
    "PANEL 2 (tense medium shot): armored Spanish soldiers and a friar plant a banner in "
    "her village; Aiyana watches from the foreground, jaw set, gripping her bow; storm "
    "clouds gathering. "
    "PANEL 3 (dynamic low-angle hero shot): the 1680 Pueblo Revolt — Aiyana leads her "
    "people rising up to reclaim their sunlit adobe town, one fist raised high. Her "
    "speech bubble: 'Our home!'. Triumphant and spirited, non-graphic, no gore."
)

PROMPT = STYLE + AIYANA + STRIP


def gen(model, aspect="16:9"):
    body = {
        "contents": [{"parts": [{"text": PROMPT}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }
    if "gemini-3" in model:
        body["generationConfig"]["imageConfig"] = {"aspectRatio": aspect}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={KEY}"
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        data = json.loads(r.read())
    for part in data["candidates"][0]["content"]["parts"]:
        if "inlineData" in part:
            return base64.b64decode(part["inlineData"]["data"])
    raise RuntimeError("no image in response: " + json.dumps(data)[:400])


def main():
    model = sys.argv[1]
    out = f"/tmp/gem_{model.replace('/', '_')}.jpg"
    try:
        png = gen(model)
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read().decode()[:300]); return
    im = Image.open(io.BytesIO(png)).convert("RGB")
    im.save(out, "JPEG", quality=90)
    print(f"OK {model} -> {out}  {im.size}")


if __name__ == "__main__":
    main()
