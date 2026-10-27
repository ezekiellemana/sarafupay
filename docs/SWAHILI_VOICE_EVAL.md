# Swahili voice notes: which Meta model hears them best?

SarafuPay organisers in Tanzania and Kenya send voice notes in Swahili, often mixed with English ("Juma amenilipa elfu ishirini cash"). Muse Voice Transcribe doesn't list Swahili, so we measured it against Muse Spark Open (Meta's open weights, served on Baseten), which listens to audio directly.

## Test set

- 12 real WhatsApp voice notes (Ogg/Opus) from 4 Swahili speakers, recorded on their own phones and shared by them for this test.
- Each speaker read the same three organiser phrases:
  - "Juma amenilipa elfu ishirini cash" (Juma paid me twenty thousand in cash)
  - "Nani bado hajalipa mchango" (Who hasn't paid their contribution yet?)
  - "Tumefikisha kiasi gani mpaka sasa" (How much have we raised so far?)
- The recordings are kept out of this public repo. `npm run eval:voice -- <folder>` runs the evaluation on any folder with a `labels.json`.

## Routes compared

1. **Muse Voice Transcribe**: `muse-voice-transcribe-1.0`, the WAV decoded from the voice note.
2. **Muse Spark Open (plain)**: the WAV as an `input_audio` part, asking for a verbatim transcript.
3. **Muse Spark Open (+ context)**: the same, with a short description of what SarafuPay voice notes are about (group money, Swahili amount words, mchango, ahadi, salio).
4. **Muse Spark Open (+ context + Voice Transcribe draft)**: the same, plus Muse Voice Transcribe's transcript as a hint that the model may overrule.

## Results (word error rate, lower is better)

| Route | Run 1 | Run 2 | Mean |
|---|---|---|---|
| Muse Voice Transcribe | 53% | 57% | **55%** |
| Muse Spark Open (plain) | 31% | 38% | **34%** |
| Muse Spark Open (+ context) | 31% | 33% | **32%** |
| Muse Spark Open (+ context + Voice Transcribe draft) | 25% | 33% | **29%** |

Muse Spark Open makes about 40% fewer word errors than Muse Voice Transcribe on Swahili. Context and the draft help a little more, but with 12 clips that gain is within run-to-run noise. Both models are non-deterministic, so each clip's result varies between runs.

What still goes wrong: errors concentrate in two speakers' clips, which every route found hard, and the payment sentence ("Juma amenilipa elfu ishirini cash") was the hardest phrase: its name and amount came through for two of the four speakers. So before recording money from a voice note alone, the agent repeats the payer and amount back and records only after the organiser confirms.

## What SarafuPay does with this

Swahili speakers' voice notes are now heard by Muse Spark Open with the SarafuPay context and Muse Voice Transcribe's draft (route 4); everyone else's go to Muse Voice Transcribe. If Muse Spark Open is unavailable, the agent falls back to the draft. See `hearVoice` in `lib/agent/engine.ts` and `listenOpen` in `lib/agent/meta-media.ts`.
