#!/usr/bin/env python3
"""Assemble studier/extra_cards.js from output/flashcards/ch*.json."""
import json
from pathlib import Path

base = Path(__file__).parent
fdir = base / "output" / "flashcards"
cards = {}
for n in range(1, 29):
    f = fdir / f"ch{n:02d}.json"
    if not f.exists():
        continue
    try:
        data = json.loads(f.read_text(encoding="utf-8"))
    except Exception:
        continue
    good = [{"q": c["q"], "a": c["a"]} for c in data
            if isinstance(c, dict) and c.get("q") and c.get("a")]
    if good:
        cards[str(n)] = good

out = base / "studier" / "extra_cards.js"
out.write_text(
    "// Extra generated flashcards per chapter (build_cards.py).\n"
    "window.EXTRA_CARDS = " + json.dumps(cards, ensure_ascii=False) + ";\n",
    encoding="utf-8")
print(f"extra_cards.js: {len(cards)} chapters, {sum(len(v) for v in cards.values())} cards")
