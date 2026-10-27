import { redirect } from "next/navigation";
import { getCollectionById, getContribution } from "@/lib/services/core";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("c") ?? "";
  const ctb = id ? await getContribution(id) : undefined;
  const col = ctb ? await getCollectionById(ctb.collectionId) : undefined;
  // Back from PayPal without paying: their status screen offers to continue or switch method.
  redirect(col && ctb ? `/c/${col.code}/thanks?ctb=${ctb.id}&card=cancelled` : "/");
}
