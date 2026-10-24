# Meta models in SarafuPay

SarafuPay's WhatsApp agent runs on the **Meta Model API** (`https://api.meta.ai/v1`, OpenAI-compatible).
Set `MODEL_API_KEY` and the agent uses Meta's models; without it, it falls back to Gemini.

| What | Model | Where in the code |
|---|---|---|
| Agent brain: plans, calls SarafuPay's tools, reads receipt photos | `muse-spark-1.3` → `muse-spark-1.2` (fallback) | `lib/agent/models.ts`, `lib/agent/engine.ts` |
| Voice notes → text | `muse-voice-transcribe-1.0` (WhatsApp Ogg/Opus decoded to 24 kHz WAV in JS) | `lib/agent/meta-media.ts` |
| Collection posters for WhatsApp groups | `muse-image-1.0` | `lib/services/sharecard.ts` |

Fallback order: each Muse Spark model in `META_MODELS`, then each Gemini model. A Meta outage never takes the bot down.
Muse Voice Transcribe doesn't list Swahili, so Swahili speakers' voice notes go to Gemini (which listens to audio) when it's configured.

## Agentic features

**Trust Copilot** (`lib/services/trust.ts`). An organiser forwards a photo of a receipt, an M-Pesa SMS screenshot or a bank slip, or says "Juma paid me 20,000 cash". Muse Spark reads the payer, amount, date and transaction ID and calls `record_offline_payment`. Every record is checked:
- the same transaction ID twice (however it's written) or the same photo twice → *duplicate*
- an ID SarafuPay already received through a payment link → *duplicate* (would be counted twice)
- an amount different from the person's pledge → *mismatch* (partial or over); an exact match closes the pledge
- another currency → *review*

Contributors can send their own receipt; it becomes a *claim* and the organiser is asked to confirm or reject it. This money is shown in reports and on the dashboard for transparency, but it's kept apart from the provider-held balance and can never be withdrawn through SarafuPay.

**Treasurer autopilot** (`lib/services/autopilot.ts`, runs with the 15-minute reconcile job). When an organiser switches it on, the agent reminds pledgers on their due date (at most every 3 days), sends a weekly report that Muse Spark writes from the ledger's facts, and sends a note once the deadline passes. It never moves money: payouts still need the organiser's one-time CONFIRM code.

**Share cards**. `make_share_card` asks Muse Image for a poster in the mood of the occasion (wedding, funeral, medical…), stores it, and sends it as a WhatsApp image with the share message as the caption. Amounts, codes and links stay in the caption, so they can't be drawn wrong.

## Tests

`npm test` covers all of this offline with a stubbed Meta API: model fallback and `reasoning_effort`, Ogg/Opus → WAV → transcription, receipt checks (duplicates, pledge match, claims), autopilot (due-date reminders, report, deadline note, no repeats, no payouts), and share cards (generation, storage, serving).
