#!/usr/bin/env python3
"""Assemble studier/data.js from output/summaries/ch*.json."""
import json
from pathlib import Path

UNITS = [
    {"id": 1, "years": "1491–1607", "name": "First Contacts",
     "weight": "4–6% of exam", "chapters": [1]},
    {"id": 2, "years": "1607–1754", "name": "Colonial America",
     "weight": "6–8% of exam", "chapters": [2, 3, 4]},
    {"id": 3, "years": "1754–1800", "name": "Revolution & the New Nation",
     "weight": "10–17% of exam", "chapters": [5, 6, 7, 8]},
    {"id": 4, "years": "1800–1848", "name": "Expanding Democracy",
     "weight": "10–17% of exam", "chapters": [9, 10, 11, 12]},
    {"id": 5, "years": "1844–1877", "name": "Division & Civil War",
     "weight": "10–17% of exam", "chapters": [13, 14, 15]},
    {"id": 6, "years": "1865–1898", "name": "The Gilded Age",
     "weight": "10–17% of exam", "chapters": [16, 17]},
    {"id": 7, "years": "1890–1945", "name": "Empire, Depression & World Wars",
     "weight": "10–17% of exam", "chapters": [18, 19, 20, 21, 22]},
    {"id": 8, "years": "1945–1980", "name": "Cold War America",
     "weight": "10–17% of exam", "chapters": [23, 24, 25]},
    {"id": 9, "years": "1980–Present", "name": "Modern America",
     "weight": "4–6% of exam", "chapters": [26, 27, 28]},
]

base = Path(__file__).parent
sdir = base / "output" / "summaries"
chapters, missing = {}, []
for n in range(1, 29):
    f = sdir / f"ch{n:02d}.json"
    if not f.exists():
        missing.append(n)
        continue
    chapters[str(n)] = json.loads(f.read_text(encoding="utf-8"))

out = base / "studier" / "data.js"
out.parent.mkdir(exist_ok=True)
out.write_text(
    "window.APUSH = "
    + json.dumps({"units": UNITS, "chapters": chapters},
                 ensure_ascii=False, indent=1)
    + ";\n",
    encoding="utf-8")
print(f"data.js written: {len(chapters)} chapters"
      + (f" — MISSING: {missing}" if missing else " — complete"))
