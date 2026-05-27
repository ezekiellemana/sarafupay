import { api } from "@/lib/api";
import type { FeePreview } from "@/types";

export const paymentsApi = {
  getFeePreview: (amount: number, channel: "mobile_money" | "card" | "unknown" = "mobile_money") =>
    api<FeePreview>(`/api/payments/fee-preview?amount=${amount}&channel=${channel}`)
};
