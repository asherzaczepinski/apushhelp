#!/usr/bin/env python3
"""Build studier/timeline.js (window.TL) from the ch<N>_timeline.json specs, so
the app can render the illustrated timeline (each dated entry + its images)."""
import json
from pathlib import Path

BASE = Path(__file__).parent
SPECS = BASE / "output" / "comic_specs"
tl = {}
for p in sorted(SPECS.glob("ch*_timeline.json")):
    n = p.stem.replace("_timeline", "")[2:]
    entries = json.loads(p.read_text())
    rows = []
    for i, e in enumerate(entries):
        imgs = [f"images/ch{int(n):02d}tl/e{i}_{j}.jpg" for j in range(len(e["prompts"]))]
        imgs = [g for g in imgs if (BASE / "studier" / g).exists()]  # only ones generated so far
        if imgs:
            rows.append({"date": e["date"], "title": e["title"], "imgs": imgs})
    tl[n] = rows
out = "// Illustrated timeline (window.TL) — built by build_timeline.py.\n"
out += "window.TL = " + json.dumps(tl, ensure_ascii=False) + ";\n"
(BASE / "studier" / "timeline.js").write_text(out)
print(f"wrote timeline.js: chapters {list(tl)}, {sum(len(v) for v in tl.values())} entries")
