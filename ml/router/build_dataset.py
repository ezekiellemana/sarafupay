"""
Builds the chat JSONL that Muse Glimmer is fine-tuned on, from templates.py.

  python ml/router/build_dataset.py

Writes ml/router/data/router_train.jsonl (holdout rows FIRST, then train rows; train.py relies on
that order) plus holdout.jsonl and train_only.jsonl. The holdout is split by template: no wording in
the holdout appears in training, so base-vs-tuned measures generalisation, not memorisation.
"""
import json
import random
import re
from pathlib import Path

from templates import (AMOUNTS_EN, AMOUNTS_SW, CODES, DAYS_EN, DAYS_SW, EVENTS_EN, EVENTS_SW,
                       FAST_INTENTS, MULTI, NAMES, PHONES, T)

# Keep in sync with ROUTER_SYSTEM in lib/agent/router.ts (the model is trained on this exact text).
ROUTER_SYSTEM = (
    "You route WhatsApp messages for SarafuPay, a group money collection service in Tanzania. "
    "Messages are in Kiswahili, English or a mix. Read ONE message and respond with ONLY a compact "
    "JSON object (no prose, no code fence) with exactly these keys, in this order:\n"
    '- "intent": one of "greeting_help", "profile_voice", "create_collection", "collection_status", '
    '"contribute", "share", "pricing", "chase_payments", "receipt_offline", "payout", '
    '"autopilot_settings", "followup", "multi", "other"\n'
    '- "lang": one of "sw", "en", "mix"\n'
    '- "route": one of "fast", "full"\n\n'
    'Example: {"intent": "payout", "lang": "sw", "route": "full"}'
)

SEED = 0
HOLDOUT_SHARE = 0.2
TRAIN_RENDERS, HOLDOUT_RENDERS = 4, 2


def fill(tpl: str, rng: random.Random) -> str:
    names = rng.sample(NAMES, 2)
    sw = rng.sample(AMOUNTS_SW, 2)
    en = rng.sample(AMOUNTS_EN, 2)
    slots = {
        "name": names[0], "name2": names[1], "code": rng.choice(CODES),
        "amount_sw": sw[0], "amount_sw2": sw[1], "amount_en": en[0], "amount_en2": en[1],
        "event_sw": rng.choice(EVENTS_SW), "event_en": rng.choice(EVENTS_EN),
        "day_sw": rng.choice(DAYS_SW), "day_en": rng.choice(DAYS_EN), "phone": rng.choice(PHONES),
        "ref": "".join(rng.choice("ABCDEFGHJKLMNPQRSTUVWXYZ0123456789") for _ in range(10)),
    }
    return tpl.format(**slots)


def noisy(text: str, rng: random.Random) -> str:
    """WhatsApp texture: lower case, dropped punctuation, the odd emoji."""
    r = rng.random()
    if r < 0.3:
        text = text.lower()
    if rng.random() < 0.3:
        text = re.sub(r"[?.!]+$", "", text)
    if rng.random() < 0.1:
        text += rng.choice([" 🙏", " 😊", " pls", " tafadhali", " asap"])
    return text


def route_of(intent: str) -> str:
    return "fast" if intent in FAST_INTENTS else "full"


def main():
    rng = random.Random(SEED)
    templates = [(intent, lang, tpl) for intent, rows in T.items() for lang, tpl in rows]
    templates += [("multi", lang, tpl) for lang, tpl in MULTI]
    by_intent: dict[str, list] = {}
    for t in templates:
        by_intent.setdefault(t[0], []).append(t)

    train, holdout = [], []
    for intent, rows in by_intent.items():
        rows = rows[:]
        rng.shuffle(rows)
        k = max(2, round(len(rows) * HOLDOUT_SHARE))
        for i, (_, lang, tpl) in enumerate(rows):
            is_holdout = i < k
            seen = set()
            for _ in range(HOLDOUT_RENDERS if is_holdout else TRAIN_RENDERS):
                text = noisy(fill(tpl, rng), rng)
                if text in seen:
                    continue
                seen.add(text)
                label = {"intent": intent, "lang": lang, "route": route_of(intent)}
                row = {"messages": [
                    {"role": "system", "content": ROUTER_SYSTEM},
                    {"role": "user", "content": text},
                    {"role": "assistant", "content": json.dumps(label)},
                ]}
                (holdout if is_holdout else train).append(row)

    rng.shuffle(train)
    rng.shuffle(holdout)
    out = Path(__file__).parent / "data"
    out.mkdir(exist_ok=True)
    def write(name, rows):
        (out / name).write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows))
    write("holdout.jsonl", holdout)
    write("train_only.jsonl", train)
    write("router_train.jsonl", holdout + train)
    counts = {}
    for r in train + holdout:
        lab = json.loads(r["messages"][2]["content"])
        counts[lab["intent"]] = counts.get(lab["intent"], 0) + 1
    print(f"templates {len(templates)} | train {len(train)} | holdout {len(holdout)} (n_eval for train.py)")
    print(json.dumps(counts, indent=1))


if __name__ == "__main__":
    main()
