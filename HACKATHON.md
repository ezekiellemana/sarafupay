# Meta Global AI Developer Hackathon (Oct 27 – Nov 4, 2026)

SarafuPay entered the **Startup track** as an existing product. This file lists exactly what was built during the hackathon window, so it can be told apart from what existed before.

- **Pre-hackathon baseline:** commit `a1d211a` (Oct 25, 2026). Everything in [docs/META_MODELS.md](docs/META_MODELS.md) up to that commit (Muse Spark agent with fallbacks, voice notes, Trust Copilot receipt checks, treasurer autopilot, agent activity log, Muse Image share cards) is the existing product.
- **Built during the hackathon:** every commit after `a1d211a`, listed below. `git diff a1d211a` shows all of it.

## New during the hackathon

### 1. Verifiable Trust Copilot

Every Trust Copilot decision now leaves a signed evidence card that anyone can check:

- **Evidence cards:** what was claimed (payer, amount, reference), which ledger rows each check compared against, the verdict, and which model decided. Cards are hash-chained per collection and signed with Ed25519, so a card can't be edited or removed without breaking the chain.
- **SAM 3.1 receipt crops:** SAM 3.1 segments the receipt out of the photo, Muse Spark points at the amount and reference, and SAM 3.1 refines those regions into tight crops. A second Muse Spark read of each crop is checked against what was recorded.
- **Self-correcting crops:** if a crop's read-back doesn't show the text Muse Spark said it saw there (usually a box one line off), the crop is moved one line up or down and read again. A crop that still disagrees with the record sends the payment to the organiser for review.
- **Public proof page:** a contributor can open `/proof/<id>` to see the evidence for their payment and confirm the signature in the browser.
- **Resilient vision calls:** field location and read-back retry on Meta API hiccups and fall back to Muse Spark Open on Baseten, so evidence is still produced when a hosted model is briefly unavailable.
- **Try it:** `npm run seed`, then `npm run demo:receipt -- <receipt photo>` sends the photo to the agent as the demo organiser and prints the reply and the new evidence cards.

### 2. Swahili voice on Meta's open weights

- **Muse Spark Open listens to Swahili voice notes:** the WhatsApp voice note is decoded to WAV and sent to Muse Spark Open on Baseten as audio, with a short description of what SarafuPay voice notes are about and Muse Voice Transcribe's draft as a hint.
- **Measured, not guessed:** on 12 real Swahili voice notes from 4 speakers, Muse Spark Open makes about 40% fewer word errors than Muse Voice Transcribe (29–34% vs 55% word error rate, mean of two runs). Method and results: [docs/SWAHILI_VOICE_EVAL.md](docs/SWAHILI_VOICE_EVAL.md). The recordings stay private; `npm run eval:voice -- <folder>` reruns it.
- **Falls back safely:** if Muse Spark Open is unavailable, the agent uses Muse Voice Transcribe's draft; if nothing was heard, it asks the person to resend or type.
- **Voice in, voice out:** a voice note gets the text reply at once (with links and details), then a voice note in the speaker's language. The speaking is Meta's open **Seamless M4T v2** on our own voice server (`voice-server/`, one male and one female voice picked from its 200 built-in speakers). The reply uses the opposite voice of the note's pitch (a higher voice hears the male voice), or the voice the person asked for ("nijibu kwa sauti ya kike"), which is remembered. Only the voice choice is stored. Live run: Muse Spark Open heard a Swahili voice note, Muse Spark answered, and Muse Spark Open listening back to the Seamless reply heard every sentence.
- **Safer voice payments:** before recording money from a voice note alone, the agent repeats the payer and amount back and records only after the organiser confirms.

### 3. Kiswahili organiser copilot

An organiser asks "nani bado hajalipa?" or "kwa nini malipo ya Juma bado yanasubiri?" (in text or a voice note) and Muse Spark investigates instead of just listing names:

- **Walks the evidence:** for each person it reads the ledger (pledges, pay links, contributions, money recorded outside SarafuPay and its trust checks) and the Snippe and PayPal webhook log, which now keeps what each event said.
- **Asks the provider:** anything still pending is checked live with Snippe or PayPal. A payment whose webhook was lost is recorded on the spot, and the payer gets their receipt.
- **Names what happened:** started paying but never entered the PIN, checkout expired, pay link never opened, pledged but not started (and whether it's overdue), outside payment waiting for the organiser, or a receipt that failed the checks. Each comes with a timeline in East Africa time.
- **Checks its own explanation:** before the organiser sees the reply, a verification layer outside the agent's control checks it against what the investigation found. Code checks that every amount and date in the reply was actually found and that nobody who was investigated is left out, and a separate Muse Spark call checks every claim against the facts. A reply that fails is rewritten from the facts with the problems as feedback and checked again, up to twice; if it still fails, it goes out with a warning instead of as fact. Each verdict (verified, corrected, flagged) is in the organiser's activity log. Live test: a reply claiming "Juma alishalipa… benki imechelewesha" and "Baraka alikataa kulipa kwa sababu ya ugonjwa" had all three invented claims caught and was rewritten to what the records show.
- **Drafts, then waits:** where a nudge would help, it drafts a reminder in the payer's own language, worded for what happened ("tuliona ulianza kulipa… lakini bado hatujapokea uthibitisho"). Nothing goes out until the organiser says yes. Each draft is sent once, with a fresh pay link, and expires after 24 hours.

### 4. Personal thank-you videos

An organiser says "watumie asante wote waliolipa" and everyone who paid gets a short video on WhatsApp, with their own name and amount spoken in their own language:

- **Muse Image** draws a thank-you card in the collection's mood (marigolds for a wedding, calm dusk for a funeral).
- **Muse Wonder** animates it into a short clip. Wonder isn't enabled for our key yet, so until it is, the card itself is used with a slow zoom; the request is already built and tested, so the clips switch on by themselves once Meta turns access on.
- **Seamless M4T v2** speaks "Asante sana Asha! Esther anakushukuru kwa mchango wako wa shilingi 20,000…" over it, on our voice server, which also puts picture and voice together into a WhatsApp video.
- **The words come from the records,** not from a model, so names and amounts are always right. Each contribution gets one video; if one fails, it isn't marked as thanked, so asking again retries it. The organiser gets a summary and a copy of the first video.

Live test: two videos (one Swahili, one English) made and delivered in 78 s on CPU.

### All AI is Meta

Gemini (a backup brain before the hackathon) and the dashboard chat's Gemini route were removed: the agent, the dashboard's Treasurer chat, vision, segmentation, listening and speaking all run on Meta models. Non-AI services stay (PayPal and Snippe payments, hosting).

## Meta models used

| Model | Where | New in hackathon? |
|---|---|---|
| SAM 3.1 | Receipt segmentation and field crops | Yes |
| Muse Spark 1.3 | Agent brain; field location and crop read-back | Agent existed; field location and read-back are new |
| Muse Spark Open (Baseten) | Fallback agent brain; fallback for field location and read-back; hears Swahili voice notes | Existing route, new host; vision fallback and Swahili listening are new |
| Muse Voice Transcribe | Voice notes; draft hint for Swahili | Existing; use as a hint is new |
| Seamless M4T v2 (open weights, self-hosted) | Spoken Swahili and English replies to voice notes; the voice in thank-you videos | Yes |
| Muse Image | Share cards; thank-you video cards | Share cards existed; thank-you cards are new |
| Muse Wonder | Animates the thank-you card (switches on when enabled for our key) | Yes |
