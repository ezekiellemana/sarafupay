/**
 * Which Tanzanian mobile money service a number belongs to, from its prefix, so payment screens can
 * say "M-Pesa" instead of "mobile money". Display only: Snippe routes the payment itself.
 */
const PREFIXES: [string[], string][] = [
  [["074", "075", "076"], "M-Pesa"],
  [["068", "069", "078"], "Airtel Money"],
  [["065", "067", "071", "077"], "Mixx by Yas"],
  [["061", "062"], "HaloPesa"],
  [["073"], "T-Pesa"],
];

/** "0754…", "255754…", "+255 754…" → "M-Pesa"; null when unknown. */
export function networkOf(phone: string | null | undefined): string | null {
  let d = (phone ?? "").replace(/\D/g, "");
  if (d.startsWith("255")) d = "0" + d.slice(3);
  else if (d.length === 9) d = "0" + d;
  return PREFIXES.find(([ps]) => ps.some((p) => d.startsWith(p)))?.[1] ?? null;
}

/** "255712345678" → "0712 ••• 678". */
export function maskPhone(phone: string | null | undefined): string {
  let d = (phone ?? "").replace(/\D/g, "");
  if (d.startsWith("255")) d = "0" + d.slice(3);
  return d.length === 10 ? `${d.slice(0, 4)} ••• ${d.slice(7)}` : "";
}
