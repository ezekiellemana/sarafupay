import { Resend } from "resend";
import { env } from "../config/env";
import { formatMoney } from "../utils/moneyFormatter";
import type { IWithdrawal } from "../models/Withdrawal.model";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const enabled = !!resend && !!env.EMAIL_FROM;

if (!resend) {
  console.warn("[email] RESEND_API_KEY not set — email notifications disabled.");
} else if (!env.EMAIL_FROM) {
  console.warn("[email] EMAIL_FROM not set — email notifications disabled.");
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!enabled) return;
  await resend!.emails.send({ from: env.EMAIL_FROM!, to, subject, html });
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function wrap(content: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e5e0d6;overflow:hidden;">
<tr><td style="background:#035034;padding:20px 28px;"><span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">SarafuPay</span></td></tr>
<tr><td style="padding:28px 28px 24px;">${content}</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e5e0d6;background:#fafaf8;">
<p style="margin:0;font-size:12px;color:#9ca3af;">This is an automated notification from SarafuPay. Do not reply to this email.</p>
<p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Questions? <a href="mailto:support@sarafupay.app" style="color:#035034;text-decoration:none;">support@sarafupay.app</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function row(label: string, value: string): string {
  return `<tr>
<td style="padding:6px 0;font-size:13px;color:#6b7280;width:50%;">${label}</td>
<td style="padding:6px 0;font-size:13px;color:#071a0e;font-weight:600;text-align:right;">${value}</td>
</tr>`;
}

function table(rows: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e0d6;border-bottom:1px solid #e5e0d6;margin-bottom:20px;">${rows}</table>`;
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#035034;color:#ffffff;font-size:14px;font-weight:600;padding:10px 20px;border-radius:10px;text-decoration:none;">${label}</a>`;
}

// ── Exported senders ──────────────────────────────────────────────────────────

export async function sendWithdrawalSubmittedAdminEmail({
  withdrawal,
  ownerName,
  ownerEmail,
  collectionTitle,
}: {
  withdrawal: IWithdrawal;
  ownerName: string;
  ownerEmail: string;
  collectionTitle: string;
}): Promise<void> {
  if (!env.ADMIN_NOTIFICATION_EMAIL) return;
  const subject = `New withdrawal request — ${collectionTitle}`;
  const html = wrap(`
    <h2 style="margin:0 0 4px;font-size:18px;font-weight:700;color:#071a0e;">New withdrawal request</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">A collection owner has submitted a withdrawal request.</p>
    ${table(
      row("Owner", `${ownerName} &lt;${ownerEmail}&gt;`) +
      row("Collection", collectionTitle) +
      row("Requested amount", formatMoney(withdrawal.requestedAmount, withdrawal.currency)) +
      row("Withdrawal fee", formatMoney(withdrawal.withdrawalFee, withdrawal.currency)) +
      row("Total deducted", formatMoney(withdrawal.totalDeducted, withdrawal.currency)) +
      row("Status", "Pending")
    )}
    ${btn("https://sarafupay.app/admin/withdrawals", "Review in Admin")}
  `);
  await sendEmail({ to: env.ADMIN_NOTIFICATION_EMAIL, subject, html });
}

export async function sendWithdrawalSubmittedOwnerEmail({
  withdrawal,
  ownerEmail,
  ownerName,
  collectionTitle,
  collectionSlug,
}: {
  withdrawal: IWithdrawal;
  ownerEmail: string;
  ownerName: string;
  collectionTitle: string;
  collectionSlug: string;
}): Promise<void> {
  const subject = `Withdrawal request received — ${collectionTitle}`;
  const dashboardUrl = `https://sarafupay.app/dashboard/collections/${collectionSlug}`;
  const html = wrap(`
    <h2 style="margin:0 0 4px;font-size:18px;font-weight:700;color:#071a0e;">Withdrawal request received</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Hi ${ownerName}, we have received your withdrawal request. Our team will review it shortly.</p>
    ${table(
      row("Collection", collectionTitle) +
      row("Requested amount", formatMoney(withdrawal.requestedAmount, withdrawal.currency)) +
      row("Withdrawal fee", formatMoney(withdrawal.withdrawalFee, withdrawal.currency)) +
      row("Total deducted from balance", formatMoney(withdrawal.totalDeducted, withdrawal.currency)) +
      row("Status", "Pending")
    )}
    <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">Most requests are reviewed within 1–2 business days. You will receive an email when your status changes.</p>
    ${btn(dashboardUrl, "View collection")}
  `);
  await sendEmail({ to: ownerEmail, subject, html });
}

export async function sendWithdrawalStatusOwnerEmail({
  withdrawal,
  ownerEmail,
  ownerName,
  collectionTitle,
  collectionSlug,
  status,
}: {
  withdrawal: IWithdrawal;
  ownerEmail: string;
  ownerName: string;
  collectionTitle: string;
  collectionSlug: string;
  status: string;
}): Promise<void> {
  const dashboardUrl = `https://sarafupay.app/dashboard/collections/${collectionSlug}`;
  const amt = formatMoney(withdrawal.requestedAmount, withdrawal.currency);

  let subject: string;
  let headline: string;
  let body: string;

  switch (status) {
    case "approved":
      subject  = `Withdrawal approved — ${collectionTitle}`;
      headline = "Withdrawal approved";
      body     = `Your withdrawal request of ${amt} for <strong>${collectionTitle}</strong> has been approved and is queued for payout. You will receive another email when the payout is initiated.`;
      break;
    case "rejected":
      subject  = `Withdrawal request declined — ${collectionTitle}`;
      headline = "Withdrawal request declined";
      body     = `Your withdrawal request of ${amt} for <strong>${collectionTitle}</strong> was declined.`
               + (withdrawal.rejectionReason ? `<br><br><strong>Reason:</strong> ${withdrawal.rejectionReason}` : "")
               + `<br><br>Your balance has been restored. If you believe this is an error, contact us at <a href="mailto:support@sarafupay.app" style="color:#035034;">support@sarafupay.app</a>.`;
      break;
    case "processing":
      subject  = `Withdrawal payout in progress — ${collectionTitle}`;
      headline = "Withdrawal payout in progress";
      body     = `Your withdrawal of ${amt} for <strong>${collectionTitle}</strong> is being processed. Expect payment to your account shortly.`;
      break;
    case "paid":
      subject  = `Withdrawal completed — ${collectionTitle}`;
      headline = "Withdrawal completed";
      body     = `Your withdrawal of ${amt} for <strong>${collectionTitle}</strong> has been completed.`
               + (withdrawal.payoutReference ? `<br><br><strong>Reference:</strong> ${withdrawal.payoutReference}` : "")
               + `<br><br>If you have not received funds within 24 hours, contact us at <a href="mailto:support@sarafupay.app" style="color:#035034;">support@sarafupay.app</a>.`;
      break;
    case "failed":
      subject  = `Withdrawal payout failed — ${collectionTitle}`;
      headline = "Withdrawal payout failed";
      body     = `Your withdrawal payout for <strong>${collectionTitle}</strong> could not be completed. Please contact us at <a href="mailto:support@sarafupay.app" style="color:#035034;">support@sarafupay.app</a> with your collection name and we will look into it promptly.`;
      break;
    default:
      return;
  }

  const html = wrap(`
    <h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#071a0e;">${headline}</h2>
    <p style="margin:0 0 4px;font-size:14px;color:#6b7280;">Hi ${ownerName},</p>
    <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">${body}</p>
    ${btn(dashboardUrl, "View collection")}
  `);
  await sendEmail({ to: ownerEmail, subject, html });
}
