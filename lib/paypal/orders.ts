import "server-only";
import {
  ApiError,
  CheckoutPaymentIntent,
  CustomError,
  OrdersController,
  PaypalExperienceLandingPage,
  PaypalExperienceUserAction,
  PaypalWalletContextShippingPreference,
  PhoneType,
  type Order,
} from "@paypal/paypal-server-sdk";
import { paypalSdk } from "./client";
import { paypalSettlement, paypalValue, type Settlement } from "../currency";
import { env } from "../env";

export type CreatedOrder = { orderId: string; approveUrl: string };

/** Creates a PayPal order for one contribution. custom_id ties the payment back to our record. */
export async function createContributionOrder(input: {
  contributionId: string;
  amountCents: number;
  currency: string;
  collectionTitle: string;
  collectionCode: string;
  /** What we already know about the payer, filled into PayPal's card form so they type less. */
  payer?: { name?: string; tzPhone?: string };
}): Promise<CreatedOrder> {
  const orders = new OrdersController(paypalSdk());
  const { result } = await orders.createOrder({
    paypalRequestId: input.contributionId,
    prefer: "return=representation",
    body: {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          referenceId: input.collectionCode,
          customId: input.contributionId,
          description: `Contribution to ${input.collectionTitle}`.slice(0, 127),
          softDescriptor: "SARAFUPAY",
          amount: { currencyCode: input.currency, value: paypalValue(input.amountCents, input.currency) },
        },
      ],
      paymentSource: {
        paypal: {
          ...prefill(input.payer),
          experienceContext: {
            brandName: "SarafuPay",
            shippingPreference: PaypalWalletContextShippingPreference.NoShipping,
            userAction: PaypalExperienceUserAction.PayNow,
            // Payers pick "Card" on our page: open PayPal on its card form, not its login page.
            landingPage: PaypalExperienceLandingPage.GuestCheckout,
            returnUrl: `${env.appUrl()}/pay/return`,
            cancelUrl: `${env.appUrl()}/pay/cancel?c=${input.contributionId}`,
          },
        },
      },
    },
  });
  const approveUrl = result.links?.find((l) => l.rel === "payer-action" || l.rel === "approve")?.href;
  if (!result.id || !approveUrl) throw new Error("PayPal did not return an approval link");
  return { orderId: result.id, approveUrl };
}

/** Name (and a Tanzanian mobile number, when we have one) for PayPal to fill in on its card form. */
function prefill(payer: { name?: string; tzPhone?: string } | undefined) {
  const words = (payer?.name ?? "").trim().split(/\s+/).filter(Boolean);
  const named = words.length && !/^anonymous$/i.test(words[0]);
  const national = payer?.tzPhone?.replace(/\D/g, "").replace(/^255/, "");
  return {
    ...(named ? { name: { givenName: words[0].slice(0, 140), ...(words.length > 1 ? { surname: words.slice(1).join(" ").slice(0, 140) } : {}) } } : {}),
    ...(national && /^[67]\d{8}$/.test(national) ? { phone: { phoneType: PhoneType.Mobile, phoneNumber: { nationalNumber: national } } } : {}),
  };
}

export type CaptureResult = {
  status: string;
  captureId?: string;
  customId?: string;
  payerEmail?: string;
  payerName?: string;
  /** What PayPal really charged on this capture, in cents (seller_receivable_breakdown.paypal_fee). */
  paypalFeeCents?: number;
  /** Amount and currency actually captured, in cents. */
  amountCents?: number;
  currency?: string;
  /** What the capture is worth in the account's currency (converted to USD when paid in another currency). */
  settled?: Settlement;
};

function summarize(order: Order): CaptureResult {
  const unit = order.purchaseUnits?.[0];
  const capture = unit?.payments?.captures?.[0];
  const name = order.payer?.name;
  const fee = capture?.sellerReceivableBreakdown?.paypalFee?.value;
  const amt = capture?.amount?.value;
  return {
    settled: capture ? paypalSettlement(capture.amount, capture.sellerReceivableBreakdown as unknown as Record<string, unknown>) : undefined,
    paypalFeeCents: fee !== undefined ? Math.round(Number(fee) * 100) : undefined,
    amountCents: amt !== undefined ? Math.round(Number(amt) * 100) : undefined,
    currency: capture?.amount?.currencyCode,
    status: order.status ?? "UNKNOWN",
    captureId: capture?.id,
    customId: unit?.customId ?? capture?.customId,
    payerEmail: order.payer?.emailAddress ?? order.paymentSource?.paypal?.emailAddress,
    payerName: [name?.givenName, name?.surname].filter(Boolean).join(" ") || undefined,
  };
}

/** PayPal's error payload keeps wire field names (debug_id, details[].issue) — see CustomError. */
function issuesOf(e: CustomError): string[] {
  return (e.result?.details ?? []).map((d) => d.issue).filter(Boolean);
}

export async function captureOrder(orderId: string): Promise<CaptureResult> {
  const orders = new OrdersController(paypalSdk());
  try {
    const { result } = await orders.captureOrder({
      id: orderId,
      paypalRequestId: `capture-${orderId}`, // idempotent: a retried capture returns the first result
      prefer: "return=representation",
    });
    return summarize(result);
  } catch (e) {
    // Webhook and return URL can race: PayPal answers 422 ORDER_ALREADY_CAPTURED to the loser.
    if (e instanceof CustomError && e.statusCode === 422 && issuesOf(e).includes("ORDER_ALREADY_CAPTURED")) {
      const { result } = await orders.getOrder({ id: orderId });
      return summarize(result);
    }
    if (e instanceof CustomError) {
      console.error(`[paypal] capture ${orderId} failed: ${e.statusCode} ${e.result?.name} ${issuesOf(e).join(",")} debug_id=${e.result?.debug_id}`);
    } else if (e instanceof ApiError) {
      console.error(`[paypal] capture ${orderId} failed: HTTP ${e.statusCode}`, e.body);
    }
    throw e;
  }
}

/** Reads an order without changing it (used by the reconcile job to recover missed webhooks). */
export async function getOrderSummary(orderId: string): Promise<CaptureResult> {
  const orders = new OrdersController(paypalSdk());
  const { result } = await orders.getOrder({ id: orderId });
  return summarize(result);
}
