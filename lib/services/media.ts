import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import { env } from "../env";
import { newId } from "../format";

export async function saveMedia(input: { data: Uint8Array; mimeType: string; collectionId?: string; prompt?: string }): Promise<{ id: string; url: string }> {
  const db = await getDb();
  const id = newId("img");
  await db.insert(schema.media).values({
    id,
    collectionId: input.collectionId ?? null,
    mimeType: input.mimeType,
    dataB64: Buffer.from(input.data).toString("base64"),
    prompt: input.prompt?.slice(0, 4000) ?? null,
  });
  return { id, url: `${env.appUrl()}/api/media/${id}` };
}

export async function getMedia(id: string) {
  const db = await getDb();
  const [m] = await db.select().from(schema.media).where(eq(schema.media.id, id));
  return m;
}
