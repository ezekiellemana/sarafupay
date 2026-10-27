import "server-only";
import { env } from "../env";
import { saveMedia } from "./media";

/**
 * Visual evidence for a receipt photo, built from two Meta models:
 * 1. SAM 3.1 finds the receipt in the photo (concept prompt "receipt").
 * 2. Muse Spark points at the printed amount and transaction reference (rough boxes).
 * 3. SAM 3.1 refines those boxes (box prompts) into tight regions, which are cropped and stored.
 * 4. Muse Spark reads each crop again on its own, and the reading is compared with what was recorded.
 *
 * Only the crops are kept, never the whole photo, so phone numbers and other details on the
 * receipt don't end up on a public proof page.
 */

export type Box = [x1: number, y1: number, x2: number, y2: number];
export type FieldName = "amount" | "reference";
export type ReceiptCrop = {
  field: FieldName;
  mediaId: string;
  url: string;
  box: Box;
  /** Which model drew the final box: SAM 3.1 when it refined Muse Spark's, else Muse Spark's own. */
  boxBy: string;
  /** What Muse Spark read in the crop alone, or null when it couldn't. */
  read: string | null;
  /** The model that did that read-back. */
  readBy: string | null;
  /** Whether that reading agrees with the recorded value. */
  matches: boolean | null;
};
export type ReceiptEvidence = {
  receiptBox: Box | null;
  width: number;
  height: number;
  crops: ReceiptCrop[];
  models: string[];
  notes: string[];
};

const auth = () => ({ Authorization: `Bearer ${env.metaApiKey()}`, "Content-Type": "application/json" });

/** Parses SAM's output grammar into boxes by object id. Mask payloads are skipped; only boxes are used. */
export function parseSamBoxes(text: string): { id: number; box: Box; w: number; h: number }[] {
  const out: { id: number; box: Box; w: number; h: number }[] = [];
  const re = /(?:^|,|<\d+f>)(\d+)<\|box;x1=(\d+);y1=(\d+);x2=(\d+);y2=(\d+);w=(\d+);h=(\d+)[^|]*\|>/g;
  for (const line of text.split("\n")) {
    for (const m of line.matchAll(re)) {
      const [, id, x1, y1, x2, y2, w, h] = m.map(Number);
      out.push({ id, box: [x1, y1, x2, y2], w, h });
    }
  }
  return out;
}

/** One SAM 3.1 request: a concept ("receipt") or box prompts. Streams over the Responses API. */
export async function segment(image: { data: Uint8Array; mimeType: string }, prompt: string) {
  const request = () =>
    fetch(`${env.metaBaseUrl()}/responses`, {
      method: "POST",
      headers: { ...auth(), Accept: "text/event-stream" },
      body: JSON.stringify({
        model: env.metaSegmentModel(),
        stream: true,
        input: [
          {
            type: "message",
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: `data:${image.mimeType};base64,${Buffer.from(image.data).toString("base64")}` },
            ],
          },
        ],
      }),
    });
  let res = await request();
  // The API now and then answers 404 "model not found" or 5xx for a moment; one retry clears it.
  if (res.status === 404 || res.status === 429 || res.status >= 500) res = await request();
  if (!res.ok) throw new Error(`segmentation failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  let text = "";
  for (const line of (await res.text()).split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6).trim();
    if (data === "[DONE]") break;
    try {
      const e = JSON.parse(data) as { type?: string; delta?: string };
      if (e.type === "response.output_text.delta" && e.delta) text += e.delta + "\n";
      if (e.type === "response.failed" || e.type === "error") throw new Error(`segmentation failed: ${data.slice(0, 200)}`);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("segmentation failed")) throw err;
    }
  }
  return parseSamBoxes(text);
}

/**
 * Muse Spark with an image, answering JSON. Tries the vision model, then the other Muse Spark models
 * on the Meta Model API, then Muse Spark Open (open weights, also multimodal) on its partner host,
 * retrying each once on overload or a transient "model not found".
 */
async function vision<T>(image: { data: Uint8Array; mimeType: string }, instruction: string): Promise<{ value: T; model: string }> {
  const routes = [
    ...[env.metaVisionModel(), ...env.metaModels()]
      .filter((m, i, a) => a.indexOf(m) === i)
      .map((model) => ({ base: env.metaBaseUrl(), key: env.metaApiKey(), model, label: model, meta: true })),
    ...(env.metaOpenApiKey() ? [{ base: env.metaOpenBaseUrl(), key: env.metaOpenApiKey(), model: env.metaOpenModel(), label: "muse-spark-open", meta: false }] : []),
  ];
  let last: unknown;
  for (const r of routes) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`${r.base}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${r.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: r.model,
          ...(r.meta ? { reasoning_effort: "low", response_format: { type: "json_object" } } : { max_tokens: 4000 }),
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: instruction },
                { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${Buffer.from(image.data).toString("base64")}` } },
              ],
            },
          ],
        }),
      }).catch((e: unknown) => e as Error);
      if (res instanceof Error) {
        last = res;
        continue;
      }
      if (!res.ok) {
        last = new Error(`vision failed ${res.status} on ${r.label}: ${(await res.text()).slice(0, 160)}`);
        if (res.status === 404 || res.status === 429 || res.status >= 500) continue;
        break; // bad key or bad request: this route won't recover, try the next one
      }
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = body.choices?.[0]?.message?.content ?? "";
      const json = /\{[\s\S]*\}/.exec(content)?.[0];
      if (!json) {
        last = new Error(`vision gave no JSON on ${r.label}`);
        continue;
      }
      return { value: JSON.parse(json) as T, model: r.label };
    }
  }
  throw last ?? new Error("no vision model configured");
}

const clampBox = (b: Box, w: number, h: number): Box | null => {
  const x1 = Math.max(0, Math.min(w - 1, Math.floor(Math.min(b[0], b[2]))));
  const y1 = Math.max(0, Math.min(h - 1, Math.floor(Math.min(b[1], b[3]))));
  const x2 = Math.max(0, Math.min(w - 1, Math.ceil(Math.max(b[0], b[2]))));
  const y2 = Math.max(0, Math.min(h - 1, Math.ceil(Math.max(b[1], b[3]))));
  return x2 - x1 >= 4 && y2 - y1 >= 4 ? [x1, y1, x2, y2] : null;
};

/** Intersection over the smaller box: SAM's refinement should stay on the same line of text. */
function overlap(a: Box, b: Box) {
  const ix = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0]));
  const iy = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const area = (x: Box) => (x[2] - x[0]) * (x[3] - x[1]);
  return (ix * iy) / Math.max(1, Math.min(area(a), area(b)));
}

export const normRef = (r?: string | null) => (r ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "") || null;

/** The amount printed on a crop, as a number of major units ("TSH 20,000.00" → 20000). */
export function amountFrom(text: string): number | null {
  const nums = [...text.replace(/(\d)[,\s](?=\d{3}\b)/g, "$1").matchAll(/\d+(?:\.\d{1,2})?/g)].map((m) => Number(m[0]));
  return nums.length ? Math.max(...nums) : null;
}

/**
 * Builds the visual evidence for a receipt photo. Never throws: anything that fails is noted, and
 * the evidence card is still made from the checks alone.
 */
export async function receiptEvidence(input: {
  image: { data: Uint8Array; mimeType: string };
  collectionId: string;
  recorded: { amount: number; reference: string | null };
}): Promise<ReceiptEvidence> {
  const notes: string[] = [];
  const models = new Set<string>();
  let locatedBy = env.metaVisionModel();
  const { default: sharp } = await import("sharp");
  // Bake in the EXIF rotation first: every coordinate below is in the photo as displayed.
  let png: Buffer, width: number, height: number;
  try {
    const { data, info } = await sharp(Buffer.from(input.image.data)).rotate().png().toBuffer({ resolveWithObject: true });
    [png, width, height] = [data, info.width, info.height];
  } catch {
    return { receiptBox: null, width: 0, height: 0, crops: [], models: [], notes: ["the photo couldn't be decoded, so no crops were made"] };
  }
  const image = { data: new Uint8Array(png), mimeType: "image/png" };

  const receipt = await segment(image, "receipt")
    .then((r) => (models.add(env.metaSegmentModel()), r))
    .catch((e) => (notes.push(`receipt segmentation unavailable (${String(e).slice(0, 80)})`), []));
  const receiptBox = receipt.sort((a, b) => (b.box[2] - b.box[0]) * (b.box[3] - b.box[1]) - (a.box[2] - a.box[0]) * (a.box[3] - a.box[1]))[0]?.box ?? null;
  if (!receiptBox && !notes.length) notes.push("SAM 3.1 didn't find a paper receipt (likely a screenshot); fields were located on the whole image");

  // Muse Spark points at the fields on the receipt alone: without the table, hands and background
  // around it, the text is larger and its boxes land on the right line far more consistently.
  const area = receiptBox ? (clampBox([receiptBox[0] - 8, receiptBox[1] - 8, receiptBox[2] + 8, receiptBox[3] + 8], width, height) ?? [0, 0, width - 1, height - 1]) : ([0, 0, width - 1, height - 1] as Box);
  const [aw, ah] = [area[2] - area[0] + 1, area[3] - area[1] + 1];
  const view = receiptBox ? await sharp(png).extract({ left: area[0], top: area[1], width: aw, height: ah }).png().toBuffer() : png;
  const located = await vision<{ fields?: { field?: string; text?: string; box?: number[] }[] }>(
    { data: new Uint8Array(view), mimeType: "image/png" },
    `This image is ${aw}x${ah} pixels. It is a payment receipt, a bank slip or a payment SMS screenshot. Find the printed AMOUNT paid and the TRANSACTION REFERENCE / ID. Reply as JSON: {"fields":[{"field":"amount"|"reference","text":"exact text as printed","box":[x1,y1,x2,y2]}]} with each box in image pixels, tightly around that line of text. Leave out a field you can't see.`,
  )
    .then((r) => (models.add(r.model), (locatedBy = r.model), r.value))
    .catch((e) => (notes.push(`field location unavailable (${String(e).slice(0, 120)})`), { fields: [] }));

  const rough = (located.fields ?? [])
    .filter((f): f is { field: FieldName; text?: string; box: number[] } => (f.field === "amount" || f.field === "reference") && Array.isArray(f.box) && f.box.length === 4)
    .map((f) => ({ field: f.field, text: f.text?.trim() || null, box: clampBox([f.box[0] + area[0], f.box[1] + area[1], f.box[2] + area[0], f.box[3] + area[1]], width, height) }))
    .filter((f): f is { field: FieldName; text: string | null; box: Box } => f.box !== null)
    .filter((f, i, a) => a.findIndex((g) => g.field === f.field) === i);
  if (!rough.length) return { receiptBox, width, height, crops: [], models: [...models], notes: [...notes, "no amount or reference was located on the image"] };

  // SAM 3.1 box prompts: one object per field, ids 1..n, refined in a single request.
  const prompt = "<0f>" + rough.map((f, i) => `${i + 1}<|box;x1=${f.box[0]};y1=${f.box[1]};x2=${f.box[2]};y2=${f.box[3]};w=${width};h=${height}|>`).join(",");
  const refined = await segment(image, prompt).catch((e) => (notes.push(`box refinement unavailable (${String(e).slice(0, 80)})`), []));

  const crops: ReceiptCrop[] = [];
  for (const [i, f] of rough.entries()) {
    const r = refined.find((x) => x.id === i + 1);
    const samBox = r && r.w === width && r.h === height ? clampBox(r.box, width, height) : null;
    // Keep SAM's box only when it tightens the located field; one that spills onto the next line is dropped.
    const area = (b: Box) => (b[2] - b[0]) * (b[3] - b[1]);
    const useSam = samBox !== null && overlap(samBox, f.box) > 0.5 && area(samBox) <= area(f.box) * 1.5;
    let box = useSam ? samBox : f.box;
    let boxBy = useSam ? env.metaSegmentModel() : locatedBy;

    const cropAt = async (b: Box) => {
      const pad = Math.round((b[3] - b[1]) * 0.25);
      const region = clampBox([b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad], width, height)!;
      return sharp(png)
        .extract({ left: region[0], top: region[1], width: region[2] - region[0] + 1, height: region[3] - region[1] + 1 })
        .png()
        .toBuffer();
    };
    // Independent read-back: the crop alone, no hint of what was recorded.
    const readCrop = async (crop: Buffer) => {
      try {
        const r2 = await vision<{ text?: string }>(
          { data: new Uint8Array(crop), mimeType: "image/png" },
          `Transcribe the ${f.field === "amount" ? "amount of money" : "transaction reference / ID"} printed in this crop exactly as shown. Reply as JSON: {"text":"..."}; use "" if it is unreadable.`,
        );
        models.add(r2.model);
        return { read: r2.value.text?.trim() || null, readBy: r2.model as string | null };
      } catch (e) {
        notes.push(`read-back of the ${f.field} unavailable (${String(e).slice(0, 120)})`);
        return { read: null, readBy: null };
      }
    };
    // The crop should show what Muse Spark said it saw there (never what was recorded).
    const showsLocated = (text: string | null) =>
      !f.text || !text ? true : f.field === "amount" ? amountFrom(text) === amountFrom(f.text) : normRef(text) === normRef(f.text);

    let crop = await cropAt(box);
    let { read, readBy } = await readCrop(crop);
    if (read !== null && !showsLocated(read)) {
      // A box one line off is the usual miss: look one line up, then one line down.
      const h = box[3] - box[1];
      for (const dy of [-1.3 * h, 1.3 * h]) {
        const moved = clampBox([box[0], box[1] + dy, box[2], box[3] + dy], width, height);
        if (!moved) continue;
        const c = await cropAt(moved);
        const r = await readCrop(c);
        if (r.read !== null && showsLocated(r.read)) {
          notes.push(`the ${f.field} crop was moved one line ${dy < 0 ? "up" : "down"} to the line ${locatedBy} read as "${f.text}"`);
          [box, boxBy, crop, read, readBy] = [moved, locatedBy, c, r.read, r.readBy];
          break;
        }
      }
    }
    const saved = await saveMedia({ data: new Uint8Array(crop), mimeType: "image/png", collectionId: input.collectionId, prompt: `receipt crop: ${f.field}` });
    const matches =
      read === null
        ? null
        : f.field === "amount"
          ? amountFrom(read) === input.recorded.amount
          : input.recorded.reference
            ? (normRef(read) ?? "").includes(normRef(input.recorded.reference)!)
            : null;
    crops.push({ field: f.field, mediaId: saved.id, url: saved.url, box, boxBy, read, readBy, matches });
  }
  return { receiptBox, width, height, crops, models: [...models], notes };
}
