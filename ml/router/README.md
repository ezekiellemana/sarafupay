# Muse Glimmer message router

A small open-weights Meta model, **Muse Glimmer 30B**, LoRA-tuned on Fireworks to read each SarafuPay
WhatsApp message and say what it is about:

```json
{"intent": "collection_status", "lang": "sw", "route": "fast"}
```

`lib/agent/router.ts` uses that answer before Muse Spark replies:

- **fast**: clear, single-purpose, low-stakes messages ("Tumefikisha kiasi gani?", "Naitwa Asha",
  "Makato ni kiasi gani?"). Muse Spark sees only the tools that intent needs (plus four read-only
  basics), with `META_FAST_REASONING_EFFORT` (default `minimal`) and at most 4 steps.
- **full**: today's path, unchanged. Always used for money and trust work (payouts, receipts and
  cash records, chasing payers, autopilot), short follow-ups like "ndio" that depend on the last
  turn, messages with several asks, photos, and whenever the router is unset, slow (>1.5 s), down or
  gives an answer off the schema. The code enforces this even if the model says "fast".
- A fast turn that errors or returns no text is retried once on the full path.

The router never answers or calls a tool. Its decision is written to the agent action log
(`route_message`).

## Data

`templates.py` holds 278 hand-written message templates in Kiswahili, English and code-switched
mixes, across 14 intents, with slots for names, collection codes, amounts, events, dates and phone
numbers. `build_dataset.py` renders them with WhatsApp-style noise (lower case, no punctuation,
emojis) into chat JSONL:

| file | rows |
|---|---|
| `data/train_only.jsonl` | 687 |
| `data/holdout.jsonl` | 97, from templates never used in training |
| `data/router_train.jsonl` | both, holdout first (what `train.py` feeds the starter) |

The holdout is split **by template**, so it measures new wordings, not memorised ones.

## What the fast path saves (measured, no router needed)

`npm run eval:fastpath` runs the first agent step on Muse Spark 1.3 for the 56 holdout messages
whose gold label is fast, once with the full tool set and once on the fast path:

| | full | fast |
|---|---|---|
| input tokens per call (mean) | 6,755 | 2,951 (-56%) |
| latency p50 | 1,258 ms | 1,018 ms (-19%) |
| same first action | | 52 / 56 |

Two of the four differences were "Has Juma paid?", where the full model investigates; those
templates were relabelled as `chase_payments` (full). The other two were reasonable ("rename X"
opened the collection first; "can I pay by card?" answered in text).

## Results: base vs tuned (run `sarafu-router-1`, 2026-11-03)

LoRA rank 8, 1 epoch, 43 steps over the 687 training rows on Fireworks Serverless Training (training
cost $0, promotional). Both models answered the same 97 holdout messages, from templates never used
in training, with a 96-token answer budget:

| | base Muse Glimmer 30B | tuned (`sarafu-router-1`) |
|---|---|---|
| exact match (all three keys) | 0 / 97 (0%) | 87 / 97 (89.7%) |
| intent accuracy | 0% | 93.8% |
| language accuracy | 0% | 95.9% |
| route (fast / full) accuracy | 0% | 95.9% |
| valid JSON | 0 / 97 (never finished an answer) | 97 / 97 |
| sampled tokens, all 97 | 9,312 | 2,254 |

Paired: the tuned model was right on 87 messages the base got wrong, and never the other way round
(p ≈ 1e-26). The base model is not "wrong" so much as unusable for this job: it starts reasoning and
runs out of the answer budget before writing any JSON.

The 10 misses (full list in `results/sarafu-router-1/predictions_tuned.jsonl`):

- **2 full messages sent to the fast path**, the costly kind: "Lipa ukumbi 30000" and "Lipa ukumbi
  laki 2" (pay the hall) were read as `contribute` instead of `payout`. The fast `contribute` path
  has no payout tool, so no money can move, but the reply would be off (it offers a payment link).
  More "lipa <supplier>" payout templates are the fix for the next run.
- 2 fast messages sent to the full path (bare collection codes "BABU88", "SHULE25" read as a
  follow-up): slower, not harmful.
- 4 language-only misses on Kiswahili/English mixes, 1 payout read as chasing payers (still full),
  1 "tell me a joke" read as `greeting_help` (still fast).

Files: `results/sarafu-router-1/summary.json` (the starter's report), `metrics.jsonl` (training
loss per step), `predictions_base.jsonl` and `predictions_tuned.jsonl`. The adapter is
`accounts/sarafupay/models/muse-starter-sl-sarafu-router-1`.

**Deployed check.** The tuned adapter was deployed on one H200 (live merge) for about 6 minutes and
`eval_router.py` re-scored the 97 holdout messages through Fireworks' chat API: the same numbers
(89.7% exact, route 95.9%, 2 full-to-fast misses, 97/97 valid JSON) and a **median latency of
0.71 s** per message from our server's side, inside the router's 1.5 s budget. The deployment was
deleted straight after (`data/eval_report.json`, `data/preds_accounts_sarafupay_deployments_sarafu-router.jsonl`).
Going live needs a deployment kept running, which bills per GPU-hour.

## Train, deploy, evaluate (needs `FIREWORKS_API_KEY`)

```bash
git clone --depth 1 https://github.com/fw-ai/cookbook.git ml/router/.cookbook
pip install -e ml/router/.cookbook/training
python ml/router/build_dataset.py
python ml/router/train.py plan
python ml/router/train.py launch --run-id sarafu-router-1   # base vs tuned on our 97-row holdout
```

LoRA SFT on Muse Glimmer is free for jobs started before 2026-12-01 (the base-vs-tuned sampling is
billed per token, a few cents). The starter writes `summary.json` with route / intent / lang
accuracy and exact match for base and tuned, and promotes the adapter to
`accounts/<acct>/models/muse-starter-sl-sarafu-router-1`.

Deploy it (bills per GPU-hour while running; delete it when you are done):

```bash
firectl deployment create accounts/<acct>/models/muse-starter-sl-sarafu-router-1 \
  --deployment-shape default --deployment-id sarafu-router --min-replica-count 1 --wait
FIREWORKS_API_KEY=... python ml/router/eval_router.py accounts/<acct>/deployments/sarafu-router
```

Then set `FIREWORKS_API_KEY` and `ROUTER_MODEL=accounts/<acct>/deployments/sarafu-router` on the
server. Leaving `ROUTER_MODEL` unset turns routing off.
