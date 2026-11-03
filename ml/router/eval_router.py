"""
Scores a router model on the template-disjoint holdout through Fireworks' OpenAI-compatible API:
intent / lang / route accuracy, exact match, valid JSON rate and latency.

  FIREWORKS_API_KEY=... python ml/router/eval_router.py accounts/<acct>/deployments/<id> [more models...]

Use it on the tuned deployment (and on the base model where it is callable) to fill RESULTS.md.
"""
import json
import re
import statistics
import sys
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
URL = "https://api.fireworks.ai/inference/v1/chat/completions"


def parse(text):
    m = re.search(r"\{.*?\}", text or "", re.S)
    try:
        return json.loads(m.group(0)) if m else None
    except Exception:
        return None


def call(model, messages, key):
    body = json.dumps({"model": model, "messages": messages, "max_tokens": 64, "temperature": 0}).encode()
    req = urllib.request.Request(URL, body, {"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    t0 = time.perf_counter()
    with urllib.request.urlopen(req, timeout=60) as r:
        out = json.load(r)
    return out["choices"][0]["message"]["content"], time.perf_counter() - t0


def main():
    import os
    key = os.environ["FIREWORKS_API_KEY"]
    rows = [json.loads(l) for l in (HERE / "data" / "holdout.jsonl").read_text().splitlines() if l.strip()]
    report = {}
    for model in sys.argv[1:]:
        hits = {"intent": 0, "lang": 0, "route": 0}
        exact = valid = unsafe = 0
        lat, preds = [], []
        for r in rows:
            gold = json.loads(r["messages"][2]["content"])
            try:
                text, s = call(model, r["messages"][:2], key)
            except Exception as e:
                text, s = f"ERROR {e}", None
            if s is not None:
                lat.append(s)
            p = parse(text) or {}
            valid += bool(p)
            ok = {k: str(p.get(k, "")).lower() == gold[k] for k in hits}
            for k in hits:
                hits[k] += ok[k]
            exact += all(ok.values())
            unsafe += gold["route"] == "full" and p.get("route") == "fast"  # the costly mistake
            preds.append({"user": r["messages"][1]["content"], "gold": gold, "answer": text})
        n = len(rows)
        report[model] = {
            "n": n, **{f"{k}_acc": round(v / n, 3) for k, v in hits.items()},
            "exact_match": round(exact / n, 3), "valid_json": round(valid / n, 3),
            "full_sent_to_fast": unsafe,
            "latency_p50_s": round(statistics.median(lat), 3) if lat else None,
        }
        safe = model.replace("/", "_")
        (HERE / "data" / f"preds_{safe}.jsonl").write_text("".join(json.dumps(p, ensure_ascii=False) + "\n" for p in preds))
        print(json.dumps({model: report[model]}, indent=1), flush=True)
    (HERE / "data" / "eval_report.json").write_text(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
