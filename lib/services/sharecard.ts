import "server-only";
import type { Collection } from "../db/schema";
import { generateImage } from "../agent/meta-media";
import { saveMedia } from "./media";

/**
 * A poster for a collection, drawn by Muse Image, for organisers to drop into their WhatsApp
 * groups. The picture carries the mood and the title; the facts (code, link, amounts) stay in
 * the caption, where they can't be misdrawn.
 */
export const MOOD: Record<string, string> = {
  wedding: "a joyful East African wedding celebration: kanga fabric patterns, marigold and gold accents, flowers, warm evening light",
  funeral: "a calm, respectful remembrance: soft dusk light over an acacia tree, white lilies, muted deep green and cream, peaceful and dignified",
  medical: "hope and care: a warm sunrise over a Tanzanian village clinic, gentle green and gold tones, caring hands",
  education: "a bright future: students' books and a schoolhouse under a wide blue sky, cheerful green and gold",
  community: "people building together: hands joined, a village gathering under a big tree, kanga patterns, gold and green",
  nonprofit: "solidarity: many hands lifting together, sunrise, gold and deep green palette",
  celebration: "a festive celebration: confetti, kanga patterns, balloons, marigold and gold",
  other: "togetherness: a circle of friends sharing, kanga-inspired patterns, deep green and gold palette",
};

export function shareCardPrompt(col: Pick<Collection, "title" | "category" | "purpose">): string {
  const mood = MOOD[col.category] ?? MOOD.other;
  const title = col.title.replace(/["\n]/g, " ").slice(0, 60);
  return [
    `Portrait poster for a WhatsApp group, celebrating a community collection ("mchango") in Tanzania.`,
    `Scene and mood: ${mood}.`,
    col.purpose ? `What it is for: ${col.purpose.slice(0, 200)}.` : "",
    `Large, elegant, perfectly spelled headline text at the top: "${title}".`,
    `Below the headline, small text: "Changia · Contribute".`,
    `No other text, no numbers, no logos, no QR codes, no brand names. Rich illustration, high contrast, tasteful, not cluttered.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function makeShareCard(col: Collection): Promise<{ url: string; id: string }> {
  const prompt = shareCardPrompt(col);
  const img = await generateImage(prompt, "1024x1280");
  return saveMedia({ data: img.data, mimeType: img.mimeType, collectionId: col.id, prompt });
}
