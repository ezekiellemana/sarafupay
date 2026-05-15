export const formatMoney = (amount: number, currency = "TZS") =>
  new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
