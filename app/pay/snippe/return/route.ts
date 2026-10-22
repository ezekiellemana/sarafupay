import { redirect } from "next/navigation";
import { checkSnippeContribution, getCollectionById, getContribution } from "@/lib/services/core";

// Snippe sends the payer back here after the hosted checkout. The webhook is the source of
// truth; this only asks Snippe once more so the thank-you page is right when it can be.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("c");
  if (!id) redirect("/pay/error?m=Missing%20payment");
  let target = "/pay/error?m=This%20payment%20could%20not%20be%20found";
  try {
    const ctb = (await checkSnippeContribution(id).catch(() => undefined)) ?? (await getContribution(id));
    const col = ctb ? await getCollectionById(ctb.collectionId) : undefined;
    if (ctb && col) target = `/c/${col.code}/thanks?ctb=${ctb.id}`;
  } catch (e) {
    console.error("[pay/snippe/return]", e);
  }
  redirect(target);
}
