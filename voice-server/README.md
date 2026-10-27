# SarafuPay voice server

Speaks the agent's replies with Meta's open **Seamless M4T v2** model, so a WhatsApp voice note gets a voice note back. The app calls it when `META_VOICE_URL` is set (`lib/agent/speech.ts`).

```
POST /speak  {"text": "Asante! Nimerekodi shilingi elfu ishirini.", "lang": "sw", "voice": "female"}
→ audio/ogg (Opus)
```

- `VOICE_KEY`: shared secret; the app sends it as `Authorization: Bearer …` (`META_VOICE_KEY`).
- `VOICE_MALE_ID`, `VOICE_FEMALE_ID`: Seamless speaker ids (0–199) for the two voices.
- CPU works (about 3 s of compute per sentence on 4 cores, 10 GB RAM); a GPU makes it near-instant.
- The Docker image bakes in the model (about 9 GB) so a cold start doesn't download it.

Seamless M4T v2 is licensed CC-BY-NC 4.0: fine for the hackathon demo, not for paid use.

## Modal (pay per use)

`modal_app.py` runs the same server on 8 Modal CPU cores (or a T4 GPU with `gpu="T4"`, which needs a payment method) that start on demand and stops after 5 idle
minutes. From the repo root, with `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET` set:

```sh
pip install modal
modal secret create sarafupay-voice VOICE_KEY=<random key>
modal deploy voice-server/modal_app.py
```

Set `META_VOICE_URL` to the printed `https://…modal.run` URL and `META_VOICE_KEY` to the same key.
The first reply after an idle period waits for the GPU to start (about 20–30 s).
