export const formatMoney = (value: number, currency = "TZS") =>
  new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);

export const formatDate = (value?: string | Date) => {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-TZ", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
};

export const currentMonth = () => new Date().toISOString().slice(0, 7);
