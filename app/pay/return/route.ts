import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCollectionById, settleOrder } from "@/lib/services/core";

// PayPal sends the payer back here with ?token=<orderId> after approval.
export async function GET(req: Request) {
  const orderId = new URL(req.url).searchParams.get("token");
  if (!orderId) redirect("/pay/error?m=Missing%20order");
  let target = "/pay/error?m=This%20payment%20could%20not%20be%20confirmed";
  try {
    const ctb = await settleOrder(orderId);
    const col = ctb ? await getCollectionById(ctb.collectionId) : undefined;
    if (ctb && col) target = `/c/${col.code}/thanks?ctb=${ctb.id}&card=returned`;
  } catch (e) {
    console.error("[pay/return]", e);
    // Declined at capture: show the payer their own status screen with a way to try again.
    const db = await getDb();
    const [ctb] = await db.select().from(schema.contributions).where(eq(schema.contributions.paypalOrderId, orderId));
    const col = ctb ? await getCollectionById(ctb.collectionId) : undefined;
    if (ctb && col) target = `/c/${col.code}/thanks?ctb=${ctb.id}&card=declined`;
  }
  redirect(target);
}
