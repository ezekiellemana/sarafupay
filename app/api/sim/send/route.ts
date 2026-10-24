import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { handleIncoming } from "@/lib/agent/engine";
import { clientIp, isPersona, personaPhone, simSession } from "@/lib/sim";
import { hit } from "@/lib/limits";

export async function POST(req: Request) {
  if (!env.simulatorEnabled()) return new Response("simulator disabled", { status: 404 });
  const sid = await simSession();
  if (!sid) return NextResponse.json({ error: "no session" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { persona?: string; text?: string; image?: string };
  const text = String(body.text ?? "").slice(0, 2000);
  // Optional photo as a data URL (the browser downsizes it to ~1600px JPEG first).
  let image: { data: Uint8Array; mimeType: string } | undefined;
  const m = typeof body.image === "string" ? /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(body.image) : null;
  if (body.image && !m) return NextResponse.json({ error: "image must be a jpeg, png or webp data URL" }, { status: 400 });
  if (m) {
    const data = new Uint8Array(Buffer.from(m[2], "base64"));
    if (data.length > 4_000_000) return NextResponse.json({ error: "image too large" }, { status: 413 });
    image = { data, mimeType: m[1] };
  }
  if (!isPersona(body.persona) || (!text.trim() && !image)) return NextResponse.json({ error: "persona and text or image required" }, { status: 400 });
  // Per-person limits live in the agent; this stops one visitor spinning up endless sessions.
  if (!(await hit(`sim-ip:${clientIp(req)}`, 60, 10 * 60_000))) return NextResponse.json({ error: "slow down" }, { status: 429 });
  await handleIncoming({ phone: `sim:${personaPhone(sid, body.persona)}`, channel: "sim", text, image });
  return NextResponse.json({ ok: true });
}
