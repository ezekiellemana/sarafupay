"use server";
import { redirect } from "next/navigation";
import { getCollectionById, startMobilePayment } from "@/lib/services/core";
import { SnippeError } from "@/lib/snippe/client";

/** Sends the PIN prompt to the number on the form, then shows the waiting page. */
export async function sendPromptAction(contributionId: string, form: FormData) {
  let target: string;
  try {
    const ctb = await startMobilePayment(contributionId, String(form.get("phone") ?? ""));
    const col = await getCollectionById(ctb.collectionId);
    target = `/c/${col!.code}/thanks?ctb=${ctb.id}`;
  } catch (e) {
    console.error("[pay/mobile]", e);
    const msg = e instanceof SnippeError || !(e instanceof Error) ? "prompt" : e.message;
    target = `/pay/${contributionId}/mobile?err=${encodeURIComponent(msg)}`;
  }
  redirect(target);
}
