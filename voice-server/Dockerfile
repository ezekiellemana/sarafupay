FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt
# Bake the model into the image so a cold start doesn't download 9 GB.
RUN python -c "from transformers import AutoProcessor, SeamlessM4Tv2ForTextToSpeech as M; AutoProcessor.from_pretrained('facebook/seamless-m4t-v2-large', use_fast=False); M.from_pretrained('facebook/seamless-m4t-v2-large')"
COPY app.py .
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
