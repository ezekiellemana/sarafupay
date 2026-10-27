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
