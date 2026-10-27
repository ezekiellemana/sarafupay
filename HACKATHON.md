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

### 2. Swahili voice on Meta's open weights (planned)

### 3. Kiswahili organiser copilot (planned)

## Meta models used

| Model | Where | New in hackathon? |
|---|---|---|
| SAM 3.1 | Receipt segmentation and field crops | Yes |
| Muse Spark 1.3 | Agent brain; field location and crop read-back | Agent existed; field location and read-back are new |
| Muse Spark Open (Baseten) | Fallback agent brain; fallback for field location and read-back | Existing route, new host; vision fallback is new |
