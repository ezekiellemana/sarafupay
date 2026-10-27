"""
Runs the voice server (app.py) on Modal: 8 CPU cores that start when a voice note needs a reply and
shut down after 5 idle minutes, so we pay only while it speaks. (A T4 GPU, gpu="T4", is faster but
needs a payment method on the Modal account.)

One-time setup (with MODAL_TOKEN_ID / MODAL_TOKEN_SECRET in the environment):
  modal secret create sarafupay-voice VOICE_KEY=<random key>
  modal deploy voice-server/modal_app.py
Then set META_VOICE_URL to the printed https://…modal.run URL and META_VOICE_KEY to the same key.
"""
import modal

MODEL = "facebook/seamless-m4t-v2-large"


def download():
    from transformers import AutoProcessor, SeamlessM4Tv2ForTextToSpeech

    AutoProcessor.from_pretrained(MODEL, use_fast=False)
    SeamlessM4Tv2ForTextToSpeech.from_pretrained(MODEL)


image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("ffmpeg")
    .pip_install_from_requirements("voice-server/requirements.txt")
    # Bake the model into the image so a cold start doesn't download it.
    .run_function(download)
    .add_local_file("voice-server/app.py", "/root/voice_app.py")
)

app = modal.App("sarafupay-voice", image=image)


@app.function(cpu=8.0, memory=12288, scaledown_window=300, timeout=600, secrets=[modal.Secret.from_name("sarafupay-voice")])
@modal.concurrent(max_inputs=4)
@modal.asgi_app()
def web():
    import voice_app

    return voice_app.app
