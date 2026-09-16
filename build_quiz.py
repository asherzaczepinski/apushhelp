#!/usr/bin/env python3
"""Build studier/quiz.js (window.QUIZ) from output/comic_specs/ch<N>_quiz.json.
Each ch<N>_quiz.json is a list of authored multiple-choice questions:
  {"concept": "<section title>", "q": "...", "choices": ["a","b","c","d"], "answer": <int>}
Only well-formed questions (4-ish choices, valid answer index) are kept."""
import json
from pathlib import Path

BASE = Path(__file__).parent
SPECS = BASE / "output" / "comic_specs"


def valid(q):
    return (isinstance(q, dict) and q.get("concept") and q.get("q")
            and isinstance(q.get("choices"), list) and len(q["choices"]) >= 2
            and isinstance(q.get("answer"), int) and 0 <= q["answer"] < len(q["choices"]))


quiz = {}
for p in sorted(SPECS.glob("ch*_quiz.json")):
    n = p.stem.replace("_quiz", "")[2:]
    try:
        data = json.loads(p.read_text())
    except Exception as e:
        print(f"ch{n}: bad JSON ({e}), skip"); continue
    good = [{"concept": q["concept"], "q": q["q"], "choices": q["choices"], "answer": q["answer"]}
            for q in data if valid(q)]
    if good:
        quiz[n] = good

out = "// Authored exam-style quiz bank (window.QUIZ) — built by build_quiz.py.\n"
out += "window.QUIZ = " + json.dumps(quiz, ensure_ascii=False) + ";\n"
(BASE / "studier" / "quiz.js").write_text(out)
total = sum(len(v) for v in quiz.values())
print(f"wrote quiz.js: {len(quiz)} chapters, {total} questions")
for n in sorted(quiz, key=int):
    concepts = len(set(q["concept"] for q in quiz[n]))
    print(f"  ch{n}: {len(quiz[n])} questions across {concepts} concepts")
