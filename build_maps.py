#!/usr/bin/env python3
"""Assemble studier/located_facts.js from output/maps/ch*.json (geocoded
place-pins, one file per chapter)."""
import json
from pathlib import Path

base = Path(__file__).parent
mdir = base / "output" / "maps"
facts, missing = {}, []
for n in range(1, 29):
    f = mdir / f"ch{n:02d}.json"
    if not f.exists():
        missing.append(n)
        continue
    data = json.loads(f.read_text(encoding="utf-8"))
    pins = [p for p in data.get("pins", [])
            if isinstance(p.get("lon"), (int, float))
            and isinstance(p.get("lat"), (int, float))]
    if not pins:
        continue
    # thin very tight clusters: within ~0.5deg keep at most 2 pins,
    # preferring ones that link to a key term (have "term")
    kept, anchors = [], []
    for p in sorted(pins, key=lambda q: (0 if q.get("term") else 1)):
        near = sum(1 for a in anchors
                   if abs(a[0] - p["lon"]) < 0.6 and abs(a[1] - p["lat"]) < 0.6)
        if near >= 2:
            continue
        kept.append(p)
        anchors.append((p["lon"], p["lat"]))
    # cap total pins per map for readability, keeping term-linked first
    pins = sorted(kept, key=lambda q: (0 if q.get("term") else 1))[:11]
    facts[str(n)] = {
        "caption": data.get("caption", ""),
        "scope": data.get("scope", "us"),
        "pins": pins,
    }

out = base / "studier" / "located_facts.js"
out.write_text(
    "// Geocoded place-pins per chapter (built from output/maps/ by build_maps.py).\n"
    "window.LOCATED_FACTS = " + json.dumps(facts, ensure_ascii=False) + ";\n",
    encoding="utf-8")
total = sum(len(v["pins"]) for v in facts.values())
print(f"located_facts.js: {len(facts)} chapters, {total} pins"
      + (f" — MISSING: {missing}" if missing else ""))
