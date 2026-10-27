"""
SarafuPay voice server: speaks agent replies with Meta's open Seamless M4T v2 model.

POST /speak {"text": "...", "lang": "sw" | "en", "voice": "male" | "female"}
  -> audio/ogg (Opus), ready to send as a WhatsApp voice note.
Auth: "Authorization: Bearer <VOICE_KEY>" when VOICE_KEY is set.

Seamless M4T v2 is licensed CC-BY-NC 4.0 (non-commercial): fine for the hackathon demo; swap the
voice before charging for it.
"""
import io
import os
import re
import subprocess

import numpy as np
import torch
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from transformers import AutoProcessor, SeamlessM4Tv2ForTextToSpeech

MODEL = os.environ.get("SEAMLESS_MODEL", "facebook/seamless-m4t-v2-large")
VOICES = {"male": int(os.environ.get("VOICE_MALE_ID", "33")), "female": int(os.environ.get("VOICE_FEMALE_ID", "18"))}
LANGS = {"sw": "swh", "en": "eng"}
RATE = 16000

torch.set_num_threads(int(os.environ.get("THREADS", str(os.cpu_count() or 4))))
device = "cuda" if torch.cuda.is_available() else "cpu"
processor = AutoProcessor.from_pretrained(MODEL, use_fast=False)
model = SeamlessM4Tv2ForTextToSpeech.from_pretrained(MODEL).to(device).eval()

app = FastAPI(title="SarafuPay voice")


class Speak(BaseModel):
    text: str = Field(min_length=1, max_length=1200)
    lang: str = "sw"
    voice: str = "female"


def sentences(text: str) -> list[str]:
    """Seamless is a translation model and can drop words from long inputs, so speak one sentence at a time."""
    parts = [p.strip() for p in re.split(r"(?<=[.!?])\s+", text) if p.strip()]
    out: list[str] = []
    for p in parts:
        while len(p) > 220:  # very long sentence: break at a comma near the middle
            cut = p.rfind(",", 0, 220)
            cut = cut if cut > 40 else 220
            out.append(p[: cut + 1].strip())
            p = p[cut + 1 :].strip()
        if p:
            out.append(p)
    return out


def synthesize(text: str, lang: str, speaker: int) -> np.ndarray:
    pause = np.zeros(int(RATE * 0.18), dtype=np.float32)
    chunks: list[np.ndarray] = []
    for s in sentences(text):
        inputs = processor(text=s, src_lang=lang, return_tensors="pt").to(device)
        with torch.no_grad():
            audio = model.generate(**inputs, tgt_lang=lang, speaker_id=speaker)[0].cpu().numpy().squeeze()
        chunks += [audio.astype(np.float32), pause]
    return np.concatenate(chunks) if chunks else np.zeros(1, dtype=np.float32)


def to_ogg_opus(samples: np.ndarray) -> bytes:
    pcm = (np.clip(samples, -1, 1) * 32767).astype("<i2").tobytes()
    run = subprocess.run(
        ["ffmpeg", "-v", "error", "-f", "s16le", "-ar", str(RATE), "-ac", "1", "-i", "pipe:0", "-c:a", "libopus", "-b:a", "32k", "-f", "ogg", "pipe:1"],
        input=pcm,
        capture_output=True,
        check=True,
    )
    return run.stdout


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL, "device": device, "voices": VOICES}


@app.post("/speak")
def speak(req: Speak, authorization: str | None = Header(default=None)):
    key = os.environ.get("VOICE_KEY")
    if key and authorization != f"Bearer {key}":
        raise HTTPException(status_code=401, detail="unauthorized")
    lang = LANGS.get(req.lang, "swh")
    speaker = VOICES.get(req.voice, VOICES["female"])
    audio = to_ogg_opus(synthesize(req.text, lang, speaker))
    return Response(content=audio, media_type="audio/ogg")
