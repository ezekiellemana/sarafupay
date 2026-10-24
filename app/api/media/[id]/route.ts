import { getMedia } from "@/lib/services/media";

// Generated share cards. Ids are random, so a card is only reachable by whoever has its link.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^img_[a-f0-9]{16}$/.test(id)) return new Response("not found", { status: 404 });
  const m = await getMedia(id);
  if (!m) return new Response("not found", { status: 404 });
  return new Response(Buffer.from(m.dataB64, "base64"), {
    headers: { "Content-Type": m.mimeType, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
