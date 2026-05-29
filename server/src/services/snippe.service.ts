import axios from "axios";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { verifySnippeSignature } from "../utils/webhookVerifier";

// SNIPPE_BASE_URL is required in production (fail-fast in env.ts).
// In development it falls back to the documented default so the server
// starts without setting the var — but payment calls will fail without a real key anyway.
const SNIPPE_API_BASE = (env.SNIPPE_BASE_URL ?? "https://api.snippe.sh").replace(/\/$/, "");

export type CreateSessionInput = {
  amount: number;
  currency: string;
  description: string;
  lineItemName?: string;
  externalReference: string;
  allowCustomAmount?: boolean;
  allowedMethods?: string[];
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  metadata: Record<string, string | number | boolean | undefined>;
};

export type SnippeSession = {
  id?: string;
  reference: string;
  status: string;
  checkoutUrl: string;
  paymentLinkUrl?: string;
};

export type SnippeWebhookEvent = {
  id?: string;
  type: string;
  data: {
    reference?: string;
    session_reference?: string;
    external_reference?: string;
    status?: string;
    amount?: { value?: number; currency?: string };
    customer?: { name?: string; phone?: string; email?: string };
    payment_method?: string;
    payment_channel?: string;
    completed_at?: string;
    metadata?: Record<string, unknown>;
  };
};

const ensureConfigured = () => {
  if (!env.SNIPPE_API_KEY) throw new AppError("Snippe API key is not configured.", 503, "SNIPPE_NOT_CONFIGURED");
};

export const createPaymentSession = async (input: CreateSessionInput): Promise<SnippeSession> => {
  ensureConfigured();

  const payload: Record<string, unknown> = {
    amount: input.amount,
    currency: input.currency,
    allowed_methods: input.allowedMethods ?? ["mobile_money", "card"],
    ...(env.SNIPPE_PROFILE_ID && { profile_id: env.SNIPPE_PROFILE_ID }),
    allow_custom_amount: input.allowCustomAmount ?? false,
    customer: input.customer,
    redirect_url: `${env.CLIENT_URL}/payment/return?reference=${input.externalReference}`,
    webhook_url: `${env.SERVER_URL}/api/webhooks/snippe`,
    description: input.description,
    metadata: input.metadata,
    line_items: [
      {
        id: "payment",
        name: input.lineItemName ?? input.description,
        quantity: 1,
        unit_price: input.amount
      }
    ],
    display: {
      show_line_items: true,
      line_items_style: "compact",
      show_description: true,
      theme: "light",
      success_message: "Payment completed successfully.",
      button_text: "Pay Now"
    }
  };

  const response = await axios.post(
    `${SNIPPE_API_BASE}/api/v1/sessions`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${env.SNIPPE_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.externalReference
      }
    }
  );
  return normalizeSnippePaymentResponse(response.data);
};

export const verifyPayment = async (reference: string) => {
  ensureConfigured();
  const response = await axios.get(`${SNIPPE_API_BASE}/api/v1/sessions/${reference}`, {
    headers: { Authorization: `Bearer ${env.SNIPPE_API_KEY}` }
  });
  return normalizeSnippePaymentResponse(response.data);
};

export const verifyWebhookSignature = (rawBody: Buffer, signature?: string, timestamp?: string) => {
  if (!env.SNIPPE_WEBHOOK_SECRET) {
    throw new AppError("Webhook secret is not configured.", 500, "WEBHOOK_SECRET_MISSING");
  }
  verifySnippeSignature(rawBody, signature, timestamp, env.SNIPPE_WEBHOOK_SECRET);
};

export const normalizeSnippePaymentResponse = (response: any): SnippeSession => {
  const data = response?.data ?? response;
  const checkoutUrl = data?.checkout_url ?? data?.payment_url;
  if (!data?.reference || !checkoutUrl) {
    throw new AppError("Snippe returned an invalid payment session.", 502, "SNIPPE_INVALID_RESPONSE");
  }
  return {
    id: data.id,
    reference: data.reference,
    status: data.status,
    checkoutUrl,
    paymentLinkUrl: data.payment_link_url
  };
};

export const normalizeSnippeWebhookEvent = (event: any): SnippeWebhookEvent => {
  if (!event?.type && event?.event) event.type = event.event;
  if (!event?.type || !event?.data) throw new AppError("Invalid webhook event.", 400, "WEBHOOK_EVENT_INVALID");
  return event as SnippeWebhookEvent;
};
