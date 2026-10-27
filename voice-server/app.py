"""
SarafuPay voice server: speaks agent replies with Meta's open Seamless M4T v2 model.

POST /speak {"text": "...", "lang": "sw" | "en", "voice": "male" | "female"}
  -> audio/ogg (Opus), ready to send as a WhatsApp voice note.
POST /video {"text": "...", "lang", "voice", "image_b64": "..." | "video_b64": "..."}
  -> video/mp4: the picture (slowly zooming) or the clip (looped) with the text spoken over it,
     ready to send as a WhatsApp video (H.264 + AAC).
Auth: "Authorization: Bearer <VOICE_KEY>" when VOICE_KEY is set.

Seamless M4T v2 is licensed CC-BY-NC 4.0 (non-commercial): fine for the hackathon demo; swap the
voice before charging for it.
"""
import base64
import io
import os
import re
import subprocess
import tempfile

import numpy as np
import torch
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from transformers import AutoProcessor, SeamlessM4Tv2ForTextToSpeech

MODEL = os.environ.get("SEAMLESS_MODEL", "facebook/seamless-m4t-v2-large")
VOICES = {"male": int(os.environ.get("VOICE_MALE_ID", "54")), "female": int(os.environ.get("VOICE_FEMALE_ID", "18"))}
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


def to_wav(samples: np.ndarray) -> bytes:
    pcm = (np.clip(samples, -1, 1) * 32767).astype("<i2").tobytes()
    head = io.BytesIO()
    head.write(b"RIFF" + (36 + len(pcm)).to_bytes(4, "little") + b"WAVEfmt ")
    head.write((16).to_bytes(4, "little") + (1).to_bytes(2, "little") + (1).to_bytes(2, "little"))
    head.write(RATE.to_bytes(4, "little") + (RATE * 2).to_bytes(4, "little") + (2).to_bytes(2, "little") + (16).to_bytes(2, "little"))
    head.write(b"data" + len(pcm).to_bytes(4, "little"))
    return head.getvalue() + pcm


def to_mp4(samples: np.ndarray, image: bytes | None, clip: bytes | None) -> bytes:
    """Voice over a still picture (a slow zoom) or a looped clip, 720x900, with a beat of silence either side."""
    lead = np.zeros(int(RATE * 0.6), dtype=np.float32)
    tail = np.zeros(int(RATE * 1.2), dtype=np.float32)
    with tempfile.TemporaryDirectory() as d:
        with open(f"{d}/voice.wav", "wb") as f:
            f.write(to_wav(np.concatenate([lead, samples, tail])))
        if clip:
            with open(f"{d}/clip.mp4", "wb") as f:
                f.write(clip)
            visual = ["-stream_loop", "-1", "-i", f"{d}/clip.mp4"]
            vf = "scale=720:900:force_original_aspect_ratio=increase,crop=720:900,fps=30,format=yuv420p"
        else:
            with open(f"{d}/card.png", "wb") as f:
                f.write(image or b"")
            visual = ["-loop", "1", "-i", f"{d}/card.png"]
            vf = (
                "scale=1440:1800:force_original_aspect_ratio=increase,crop=1440:1800,"
                "zoompan=z='min(zoom+0.0007,1.15)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=720x900:fps=30,format=yuv420p"
            )
        subprocess.run(
            ["ffmpeg", "-v", "error", *visual, "-i", f"{d}/voice.wav", "-filter_complex", f"[0:v]{vf}[v]", "-map", "[v]", "-map", "1:a",
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart",
             f"{d}/out.mp4"],
            check=True,
            capture_output=True,
        )
        with open(f"{d}/out.mp4", "rb") as f:
            return f.read()


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


def check_key(authorization: str | None):
    key = os.environ.get("VOICE_KEY")
    if key and authorization != f"Bearer {key}":
        raise HTTPException(status_code=401, detail="unauthorized")


@app.post("/speak")
def speak(req: Speak, authorization: str | None = Header(default=None)):
    check_key(authorization)
    lang = LANGS.get(req.lang, "swh")
    speaker = VOICES.get(req.voice, VOICES["female"])
    audio = to_ogg_opus(synthesize(req.text, lang, speaker))
    return Response(content=audio, media_type="audio/ogg")


class Video(Speak):
    image_b64: str | None = None
    video_b64: str | None = None


@app.post("/video")
def video(req: Video, authorization: str | None = Header(default=None)):
    check_key(authorization)
    if not req.image_b64 and not req.video_b64:
        raise HTTPException(status_code=400, detail="image_b64 or video_b64 is required")
    lang = LANGS.get(req.lang, "swh")
    speaker = VOICES.get(req.voice, VOICES["female"])
    samples = synthesize(req.text, lang, speaker)
    clip = base64.b64decode(req.video_b64) if req.video_b64 else None
    image = base64.b64decode(req.image_b64) if req.image_b64 else None
    return Response(content=to_mp4(samples, image, clip), media_type="video/mp4")
