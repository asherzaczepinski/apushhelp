#!/usr/bin/env python3
"""Build studier/timeline.js (window.TL) from the ch<N>_timeline.json specs.
Each entry gets {date, title, imgs, text}, where `text` is the key term's
definition (or the timeline event) from data.js, shown under the images."""
import json
import re
from pathlib import Path

BASE = Path(__file__).parent
SPECS = BASE / "output" / "comic_specs"

# data.js provides the key-term definitions + timeline events for the caption text
_src = (BASE / "studier" / "data.js").read_text()
_src = _src[_src.index("{"):_src.rindex("}") + 1]
CH = json.loads(_src)["chapters"]


def norm(s):
    return re.sub(r"[^a-z0-9 ]", "", re.sub(r"\(.*?\)", "", (s or "").lower())).strip()


def find_text(nstr, title, date):
    c = CH.get(nstr, {})
    tn = norm(title)
    best, best_len = "", 0
    for t in c.get("key_terms", []):
        kn = norm(t.get("term", ""))
        if kn and (kn in tn or tn in kn) and len(kn) > best_len:
            best, best_len = (t.get("def") or t.get("definition") or ""), len(kn)
    if best:
        return best
    yrs = re.findall(r"\d{3,4}", date or "")
    for t in c.get("timeline", []):
        if yrs and re.findall(r"\d{3,4}", str(t.get("year", ""))) [:1] == yrs[:1]:
            return t.get("event", "")
    words = [w for w in tn.split() if len(w) > 3]
    for t in c.get("timeline", []):
        ev = norm(t.get("event", ""))
        if words and sum(1 for w in words if w in ev) >= max(1, len(words) // 2):
            return t.get("event", "")
    return ""


tl = {}
for p in sorted(SPECS.glob("ch*_timeline.json")):
    n = p.stem.replace("_timeline", "")[2:]
    entries = json.loads(p.read_text())
    dpath = SPECS / f"ch{n}_details.json"
    details = json.loads(dpath.read_text()) if dpath.exists() else []
    rows = []
    for i, e in enumerate(entries):
        imgs = [f"images/ch{int(n):02d}tl/e{i}_{j}.jpg" for j in range(len(e["prompts"]))]
        imgs = [g for g in imgs if (BASE / "studier" / g).exists()]
        if imgs:
            row = {"date": e["date"], "title": e["title"], "imgs": imgs,
                   "text": find_text(n, e["title"], e["date"])}
            if i < len(details) and details[i]:
                row["detail"] = details[i]
            rows.append(row)
    tl[n] = rows

out = "// Illustrated timeline (window.TL) — built by build_timeline.py.\n"
out += "window.TL = " + json.dumps(tl, ensure_ascii=False) + ";\n"
(BASE / "studier" / "timeline.js").write_text(out)
covered = sum(1 for v in tl.values() for e in v if e["text"])
total = sum(len(v) for v in tl.values())
print(f"wrote timeline.js: {len(tl)} chapters, {total} entries, {covered} with text")
