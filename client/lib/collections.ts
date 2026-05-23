import { api } from "@/lib/api";
import type { Collection, CollectionSummary, Payment } from "@/types";

export type CreateCollectionPayload = {
  title: string;
  description?: string;
  collectionType?: string;
  targetAmount?: number;
  suggestedAmount?: number;
  minimumAmount?: number;
  currency?: string;
  allowCustomAmount?: boolean;
  startDate?: string;
  endDate?: string;
  visibility?: string;
  coverImageUrl?: string;
  paymentPurpose?: string;
  thankYouMessage?: string;
};

export type PublicPaymentPayload = {
  collectionSlug: string;
  payerName: string;
  payerPhone: string;
  payerEmail?: string;
  amount: number;
  payerMessage?: string;
};

export const collectionsApi = {
  create: (data: CreateCollectionPayload) =>
    api<{ collection: Collection }>("/api/collections", { method: "POST", body: JSON.stringify(data) }),

  getMyCollections: () =>
    api<{ collections: Collection[] }>("/api/collections/my"),

  getById: (id: string) =>
    api<{ collection: Collection }>(`/api/collections/${id}`),

  getPublic: (slug: string) =>
    api<{ collection: Collection }>(`/api/collections/public/${slug}`),

  update: (id: string, data: Partial<CreateCollectionPayload & { status: string }>) =>
    api<{ collection: Collection }>(`/api/collections/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  close: (id: string) =>
    api(`/api/collections/${id}`, { method: "DELETE" }),

  getPayments: (id: string) =>
    api<{ payments: Payment[] }>(`/api/collections/${id}/payments`),

  getSummary: (id: string) =>
    api<CollectionSummary>(`/api/collections/${id}/summary`),

  exportCsv: (id: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
    window.open(`${API_URL}/api/collections/${id}/export/csv`, "_blank");
  },

  createPublicSession: (data: PublicPaymentPayload) =>
    api<{ checkout_url: string; payment: { externalReference: string } }>("/api/payments/create-public-session", {
      method: "POST",
      body: JSON.stringify(data)
    })
};

export const COLLECTION_TYPE_LABELS: Record<string, string> = {
  monthly_contribution: "Monthly Contribution",
  event: "Event",
  wedding: "Wedding",
  birthday: "Birthday",
  charity: "Charity",
  emergency: "Emergency",
  school: "School",
  church: "Church",
  mosque: "Mosque",
  trip: "Trip",
  business: "Business",
  custom: "Custom"
};

export const COLLECTION_TYPE_EMOJIS: Record<string, string> = {
  monthly_contribution: "📅",
  event: "🎉",
  wedding: "💍",
  birthday: "🎂",
  charity: "❤️",
  emergency: "🚨",
  school: "🎓",
  church: "⛪",
  mosque: "🕌",
  trip: "✈️",
  business: "💼",
  custom: "💰"
};
