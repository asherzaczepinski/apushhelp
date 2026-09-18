#!/usr/bin/env python3
"""Generate per-choice explanations for the quiz bank.

For every authored question in output/comic_specs/ch<N>_quiz.json we ask the LLM
for: a short "why the correct answer is right" line, and a short "why this is
wrong" line for each incorrect choice. Results are cached (resumable) in
output/quiz_explanations.json, keyed by a hash of the question + choices, so
re-running only fills gaps.

Run: .venv/bin/python gen_explanations.py
Then rebuild: python build_quiz.py
"""
import json, hashlib, urllib.request, urllib.error, time, socket
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = Path(__file__).parent
SPECS = BASE / "output" / "comic_specs"
CACHE = BASE / "output" / "quiz_explanations.json"
KEY = (BASE / ".openai_key").read_text().strip()
MODEL = "gpt-4o-mini"
BATCH = 8
WORKERS = 6

def qkey(q):
    h = hashlib.sha1((q["q"] + "||" + "|".join(q["choices"])).encode()).hexdigest()
    return h[:16]

def load_cache():
    if CACHE.exists():
        return json.loads(CACHE.read_text())
    return {}

def valid(q):
    return (isinstance(q, dict) and q.get("q") and isinstance(q.get("choices"), list)
            and len(q["choices"]) >= 2 and isinstance(q.get("answer"), int)
            and 0 <= q["answer"] < len(q["choices"]))

# collect every unique question once
def collect():
    seen, items = set(), []
    for p in sorted(SPECS.glob("ch*_quiz.json")):
        try:
            data = json.loads(p.read_text())
        except Exception:
            continue
        for q in data:
            if not valid(q):
                continue
            k = qkey(q)
            if k in seen:
                continue
            seen.add(k)
            items.append((k, q))
    return items

SYS = ("You write terse study explanations for AP US History multiple-choice questions. "
       "For each question you are given the choices and the index of the correct one. "
       "Return why the correct answer is right, and for each WRONG choice a one-line reason "
       "it is incorrect. Be factual and specific to the history. Max 22 words per line. "
       "No preamble, no restating the choice text.")

def build_prompt(batch):
    qs = []
    for j, (_, q) in enumerate(batch):
        qs.append({
            "i": j,
            "question": q["q"],
            "choices": q["choices"],
            "correct_index": q["answer"],
        })
    instr = ("Return JSON: {\"items\":[{\"i\":<i>,\"right\":\"why the correct choice is correct\","
             "\"wrong\":{\"<choice_index>\":\"why that wrong choice is incorrect\", ...}}]}. "
             "Include an entry in \"wrong\" for every index that is NOT the correct_index.\n\n"
             + json.dumps(qs, ensure_ascii=False))
    return instr

def call(batch, retries=4):
    body = json.dumps({
        "model": MODEL,
        "messages": [{"role": "system", "content": SYS},
                     {"role": "user", "content": build_prompt(batch)}],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
    }).encode()
    for attempt in range(retries):
        try:
            req = urllib.request.Request("https://api.openai.com/v1/chat/completions",
                data=body, headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
            r = urllib.request.urlopen(req, timeout=90)
            d = json.load(r)
            parsed = json.loads(d["choices"][0]["message"]["content"])
            out = {}
            for it in parsed.get("items", []):
                j = it.get("i")
                if j is None or j >= len(batch):
                    continue
                k, q = batch[j]
                wrong = {}
                for idx_str, reason in (it.get("wrong") or {}).items():
                    try:
                        idx = int(idx_str)
                    except (ValueError, TypeError):
                        continue
                    if 0 <= idx < len(q["choices"]) and idx != q["answer"]:
                        wrong[q["choices"][idx]] = reason  # key by choice TEXT for the app
                out[k] = {"right": it.get("right", ""), "wrong": wrong}
            return out
        except (urllib.error.HTTPError, urllib.error.URLError, socket.timeout,
                TimeoutError, OSError, json.JSONDecodeError, KeyError) as e:
            if attempt == retries - 1:
                print(f"  batch failed: {e}")
                return {}
            time.sleep(2 * (attempt + 1))
    return {}

def main():
    cache = load_cache()
    items = collect()
    todo = [(k, q) for (k, q) in items if k not in cache]
    print(f"total unique questions: {len(items)}; cached: {len(items)-len(todo)}; to generate: {len(todo)}")
    if not todo:
        print("nothing to do")
        return
    batches = [todo[i:i+BATCH] for i in range(0, len(todo), BATCH)]
    done = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(call, b): b for b in batches}
        for fut in as_completed(futs):
            try:
                res = fut.result()
            except Exception as e:
                print(f"  batch crashed: {e}")
                res = {}
            cache.update(res)
            done += 1
            if done % 10 == 0 or done == len(batches):
                CACHE.write_text(json.dumps(cache, ensure_ascii=False))
                print(f"  {done}/{len(batches)} batches, cache size {len(cache)}")
    CACHE.write_text(json.dumps(cache, ensure_ascii=False))
    print(f"done. explanations cached: {len(cache)}")

if __name__ == "__main__":
    main()
