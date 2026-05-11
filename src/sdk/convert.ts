export function toWei(amount: string | number | bigint): bigint {
  if (typeof amount === "bigint") return amount;
  if (typeof amount === "number") return BigInt(amount) * 10n ** 18n;
  if (amount.includes(".")) {
    const parts = amount.split(".");
    const whole = parts[0] ?? "0";
    const frac = parts[1] ?? "";
    const padded = (frac + "0".repeat(18)).slice(0, 18);
    return BigInt(whole) * 10n ** 18n + BigInt(padded);
  }
  return BigInt(amount) * 10n ** 18n;
}

export function toBigint(v: bigint | number | Date): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  return BigInt(Math.floor(v.getTime() / 1000));
}

export function toAmountString(v: string | bigint | number): string {
  return typeof v === "string" ? v : v.toString();
}
