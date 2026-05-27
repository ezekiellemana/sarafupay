export type PaymentChannel = "mobile_money" | "card" | "unknown";

export type ContributionFeeResult = {
  contributionAmount: number;
  serviceFee: number;
  totalChargedAmount: number;
  ownerReceivableAmount: number;
  feeRate: number;
  feeMin: number;
  feeMax: number | null;
  feeVersion: number;
  paymentChannel: PaymentChannel;
};

export type WithdrawalFeeResult = {
  requestedAmount: number;
  withdrawalFee: number;
  totalDeducted: number;
  ownerReceives: number;
  estimatedProviderFee: number;
  estimatedPlatformNet: number;
  minimumWithdrawalAmount: number;
};

const FEE_VERSION = 1;
const MINIMUM_WITHDRAWAL = 10_000;
const WITHDRAWAL_FEE = 2_000;
const ESTIMATED_PROVIDER_WITHDRAWAL_FEE = 1_500;

function assertWholePositiveTZS(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number") throw new Error(`${label} must be a number`);
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  if (!Number.isInteger(value)) throw new Error(`${label} must be a whole-number TZS amount`);
  if (value <= 0) throw new Error(`${label} must be a positive integer`);
}

/**
 * Calculate the SarafuPay service fee for a contribution.
 *
 * Mobile money: 3%, clamped TZS 300–5,000.
 * Card:         5%, minimum TZS 500, no cap.
 * Unknown:      falls back to mobile_money pricing; paymentChannel is preserved as "unknown".
 *
 * Throws on invalid contributionAmount (non-number, NaN, Infinity, decimal, ≤ 0).
 */
export function calculateContributionFee(
  contributionAmount: number,
  channel: PaymentChannel,
): ContributionFeeResult {
  assertWholePositiveTZS(contributionAmount, "contributionAmount");

  let serviceFee: number;
  let feeRate: number;
  let feeMin: number;
  let feeMax: number | null;

  if (channel === "card") {
    feeRate = 0.05;
    feeMin  = 500;
    feeMax  = null;
    serviceFee = Math.max(Math.ceil(contributionAmount * feeRate), feeMin);
  } else {
    // mobile_money and unknown both use mobile-money pricing
    feeRate = 0.03;
    feeMin  = 300;
    feeMax  = 5_000;
    serviceFee = Math.min(Math.max(Math.ceil(contributionAmount * feeRate), feeMin), feeMax);
  }

  return {
    contributionAmount,
    serviceFee,
    totalChargedAmount: contributionAmount + serviceFee,
    ownerReceivableAmount: contributionAmount,
    feeRate,
    feeMin,
    feeMax,
    feeVersion: FEE_VERSION,
    paymentChannel: channel,
  };
}

/**
 * Calculate the total amount that must be deducted from the owner's wallet
 * to fulfil a withdrawal request.
 *
 * requestedAmount = what the owner wants to receive
 * totalDeducted   = requestedAmount + withdrawalFee (2,000)
 * ownerReceives   = requestedAmount (unchanged)
 *
 * Throws if requestedAmount < 10,000 or is otherwise invalid.
 */
export function calculateWithdrawalFee(requestedAmount: number): WithdrawalFeeResult {
  assertWholePositiveTZS(requestedAmount, "requestedAmount");
  if (requestedAmount < MINIMUM_WITHDRAWAL) {
    throw new Error(
      `Minimum withdrawal amount is TZS ${MINIMUM_WITHDRAWAL.toLocaleString()}. Requested: TZS ${requestedAmount.toLocaleString()}.`,
    );
  }

  return {
    requestedAmount,
    withdrawalFee: WITHDRAWAL_FEE,
    totalDeducted: requestedAmount + WITHDRAWAL_FEE,
    ownerReceives: requestedAmount,
    estimatedProviderFee: ESTIMATED_PROVIDER_WITHDRAWAL_FEE,
    estimatedPlatformNet: WITHDRAWAL_FEE - ESTIMATED_PROVIDER_WITHDRAWAL_FEE,
    minimumWithdrawalAmount: MINIMUM_WITHDRAWAL,
  };
}
