import math, subprocess, wave, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

D = sys.argv[1]
W, H, FPS = 1080, 1920, 30
GREEN, DEEP, GOLD, CREAM, WA = (11, 48, 36), (6, 28, 21), (226, 168, 58), (255, 250, 240), (37, 211, 102)
F = "/usr/share/fonts/opentype/inter/"
def font(w, s): return ImageFont.truetype(F + f"Inter-{w}.otf", s)
EMO = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"

def env(path, bars):
    with wave.open(path) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float)
    ch = np.array_split(np.abs(a), bars)
    v = np.array([c.mean() for c in ch]); v = v / v.max()
    return np.clip(v ** 0.7, 0.08, 1), len(a) / 48000

QV, QD = env(f"{D}/q.wav", 34)
RV, RD = env(f"{D}/r.wav", 34)
LOGO = Image.open("/home/user/sarafupay/public/brand/sarafupay-logo-dark.png").convert("RGBA")
ICON = Image.open("/home/user/sarafupay/public/brand/sarafupay-icon.png").convert("RGBA")

def ease(t): t = max(0, min(1, t)); return 1 - (1 - t) ** 3
def bg():
    im = Image.new("RGB", (W, H), GREEN)
    g = Image.new("L", (W, H), 0); d = ImageDraw.Draw(g)
    d.ellipse((-300, -200, 1400, 1300), fill=90)
    g = g.filter(ImageFilter.GaussianBlur(220))
    return Image.composite(Image.new("RGB", (W, H), (22, 82, 60)), im, g)
BG = bg()

def text(d, xy, s, f, fill, a=1.0, anchor="mm"):
    c = tuple(fill) + (int(255 * max(0, min(1, a))),)
    d.text(xy, s, font=f, fill=c, anchor=anchor)

def rise(d, y, s, f, fill, t, delay=0, x=W // 2):
    k = ease((t - delay) / 0.45)
    text(d, (x, y + 60 * (1 - k)), s, f, fill, k)

def bubble(im, y, side, vals, dur, t, label, avatar_txt):
    d = ImageDraw.Draw(im, "RGBA")
    k = ease(t / 0.35)
    bw, bh = 760, 170
    x = 90 if side == "l" else W - 90 - bw
    yy = y + 80 * (1 - k)
    col = (255, 255, 255, int(255 * k)) if side == "l" else (217, 253, 211, int(255 * k))
    d.rounded_rectangle((x, yy, x + bw, yy + bh), 44, fill=col)
    # avatar
    d.ellipse((x + 28, yy + 35, x + 128, yy + 135), fill=GOLD + (int(255 * k),) if side == "l" else GREEN + (int(255 * k),))
    text(d, (x + 78, yy + 85), avatar_txt, font("Bold", 40), CREAM if side == "r" else DEEP, k)
    prog = max(0, min(1, (t - 0.35) / dur))
    # play triangle / bars
    px = x + 160
    d.polygon([(px, yy + 60), (px, yy + 110), (px + 40, yy + 85)], fill=(84, 101, 111, int(255 * k)))
    n = len(vals); bx0 = px + 70; step = (bw - 250) / n
    for i, v in enumerate(vals):
        live = i / n <= prog
        pulse = 1 + (0.25 * math.sin(t * 18 + i) if live and prog < 1 else 0)
        h = 14 + 70 * v * pulse
        c = (21, 128, 61) if live else (170, 180, 186)
        bx = bx0 + i * step
        d.rounded_rectangle((bx, yy + 85 - h / 2, bx + step * 0.55, yy + 85 + h / 2), 4, fill=c + (int(255 * k),))
    secs = dur * prog if prog < 1 else dur
    text(d, (x + bw - 40, yy + bh - 30), f"0:{int(secs):02d}", font("Medium", 28), (84, 101, 111), k, "rm")
    text(d, (x + (40 if side == "l" else bw - 40), yy - 34), label, font("SemiBold", 34), CREAM, k * 0.9, "lm" if side == "l" else "rm")

def pill(d, cx, y, s, t, delay=0, fill=GOLD, fg=DEEP, size=36):
    k = ease((t - delay) / 0.4)
    f = font("Bold", size); w = d.textlength(s, font=f) + 70
    d.rounded_rectangle((cx - w / 2, y - 40, cx + w / 2, y + 40), 40, fill=fill + (int(255 * k),))
    text(d, (cx, y), s, f, fg, k)

ASHA = None
def asha(i):
    return Image.open(f"{D}/asha/{min(380, i + 1):04d}.png").convert("RGB")

# timeline (seconds)
S = [("hook", 3.2), ("q", 4.4), ("stat", 2.8), ("r", 10.2), ("paid", 2.2), ("thx", 11.6), ("end", 3.6)]
starts = {}; acc = 0
for n, l in S: starts[n] = acc; acc += l
TOTAL = acc

def frame(n):
    T = n / FPS
    name = [s for s, l in S if starts[s] <= T][-1]; t = T - starts[name]
    im = BG.copy(); d = ImageDraw.Draw(im, "RGBA")
    if name == "hook":
        rise(d, 560, "DAY 2 · META AI HACKATHON", font("Bold", 40), GOLD, t)
        rise(d, 800, "Send a voice note", font("Black", 96), CREAM, t, 0.25)
        rise(d, 920, "in Swahili.", font("Black", 96), CREAM, t, 0.4)
        rise(d, 1120, "Get one back. 🔊" if False else "Get one back.", font("Black", 110), GOLD, t, 1.1)
        rise(d, 1290, "Then a thank-you video. 🎬" if False else "Then a thank-you video.", font("SemiBold", 56), CREAM, t, 1.8)
    elif name == "q":
        text(d, (W // 2, 330), "An organiser asks on WhatsApp", font("SemiBold", 44), CREAM, ease(t / 0.4))
        bubble(im, 640, "r", QV, QD, t, "Esther · organiser", "E")
        rise(d, 1020, "“Nani bado hajalipa mchango?”", font("Bold", 58), CREAM, t, 0.6)
        rise(d, 1100, "Who still hasn't paid?", font("Medium", 42), (190, 215, 200), t, 0.8)
        pill(d, W // 2, 1400, "Heard by Muse Spark Open", t, 1.6)
        rise(d, 1500, "Meta open weights", font("Medium", 36), (190, 215, 200), t, 1.9)
    elif name == "stat":
        k = ease(t / 0.5); num = int(40 * k)
        text(d, (W // 2, 760), f"{num}%", font("Black", 300), GOLD, k)
        rise(d, 990, "fewer word errors", font("Black", 76), CREAM, t, 0.2)
        rise(d, 1080, "than Muse Voice Transcribe", font("SemiBold", 48), CREAM, t, 0.35)
        rise(d, 1220, "12 real Swahili voice notes · 4 speakers", font("Medium", 38), (190, 215, 200), t, 0.6)
    elif name == "r":
        bubble(im, 300, "r", QV, QD, 99, "Esther · organiser", "E")
        bubble(im, 640, "l", RV, RD, t, "SarafuPay copilot", "S")
        rise(d, 1010, "It checks every payment live,", font("Bold", 52), CREAM, t, 0.8)
        rise(d, 1085, "then answers by voice", font("Bold", 52), CREAM, t, 1.0)
        pill(d, W // 2, 1300, "Spoken by Seamless M4T v2", t, 1.8)
        rise(d, 1400, "open weights, on our own voice server", font("Medium", 36), (190, 215, 200), t, 2.1)
        rise(d, 1560, "Humans approve every reminder ✅" if False else "The organiser approves every reminder.", font("SemiBold", 40), GOLD, t, 4.5)
    elif name == "paid":
        k = ease(t / 0.35); s = 0.6 + 0.4 * k
        r = int(150 * s)
        d.ellipse((W // 2 - r, 760 - r, W // 2 + r, 760 + r), fill=WA + (int(255 * k),))
        d.line([(W // 2 - 60 * s, 760), (W // 2 - 15 * s, 810 * 1 + 0), (W // 2 + 70 * s, 700)], fill=(255, 255, 255, int(255 * k)), width=int(28 * s), joint="curve")
        rise(d, 1060, "Asha pays TZS 20,000", font("Black", 80), CREAM, t, 0.2)
        rise(d, 1160, "…and gets a personal thank-you", font("SemiBold", 48), GOLD, t, 0.5)
    elif name == "thx":
        k = ease(t / 0.4)
        fr = asha(int(t * FPS)).resize((900, 1125), Image.LANCZOS)
        mask = Image.new("L", fr.size, 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, 900, 1125), 48, fill=255)
        y = int(330 + 100 * (1 - k))
        sh = Image.new("L", (W, H), 0); ImageDraw.Draw(sh).rounded_rectangle((90, y + 20, 990, y + 1145), 48, fill=int(140 * k))
        im.paste(Image.new("RGB", (W, H), DEEP), (0, 0), sh.filter(ImageFilter.GaussianBlur(30)))
        im.paste(fr, (90, y), Image.eval(mask, lambda p: int(p * k)))
        d = ImageDraw.Draw(im, "RGBA")
        text(d, (W // 2, 230), "Made for Asha, sent on WhatsApp", font("Bold", 50), CREAM, k)
        cap = "“Asante sana Asha! Esther anakushukuru…”"
        rise(d, 1560, cap, font("SemiBold", 44), CREAM, t, 0.8)
        pill(d, W // 2 - 205, 1690, "Muse Image", t, 1.6, size=34)
        pill(d, W // 2 + 175, 1690, "Seamless M4T v2", t, 1.8, size=34)
    elif name == "end":
        k = ease(t / 0.5)
        lg = LOGO.copy(); lg.thumbnail((640, 300))
        a = lg.split()[3].point(lambda p: int(p * k))
        im.paste(lg, ((W - lg.width) // 2, 600), a)
        d = ImageDraw.Draw(im, "RGBA")
        rise(d, 1000, "Money runs on trust.", font("Black", 76), CREAM, t, 0.2)
        rise(d, 1090, "Now it speaks Swahili.", font("Black", 76), GOLD, t, 0.45)
        rise(d, 1300, "Muse Spark Open · Seamless M4T v2 · Muse Image", font("Medium", 34), (190, 215, 200), t, 0.8)
        rise(d, 1360, "Built at the Meta AI Hackathon · sarafupay.app", font("Medium", 34), (190, 215, 200), t, 1.0)
    # top brand bug
    if name not in ("end",):
        ic = ICON.copy(); ic.thumbnail((64, 64)); im.paste(ic, (60, 90), ic)
        ImageDraw.Draw(im).text((140, 122), "SarafuPay", font=font("Bold", 36), fill=CREAM, anchor="lm")
    return im

if __name__ == "__main__":
    if len(sys.argv) > 2:
        for s in sys.argv[2:]: frame(int(float(s) * FPS)).save(f"{D}/still_{s}.png")
        print(starts, TOTAL); sys.exit()
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", f"{D}/v.mp4"], stdin=subprocess.PIPE)
    for n in range(int(TOTAL * FPS)): p.stdin.write(frame(n).tobytes())
    p.stdin.close(); p.wait(); print(starts, TOTAL)
