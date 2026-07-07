export function toWei(amount: string | number | bigint): bigint {
  if (typeof amount === "bigint") return amount;
  if (typeof amount === "number") {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new Error("amount must be a non-negative integer; pass a string for decimals");
    }
    return BigInt(amount) * 10n ** 18n;
  }
  const m = /^(\d+)(?:\.(\d+))?$/.exec(amount);
  if (!m) throw new Error("invalid amount string");
  const whole = m[1] ?? "0";
  const frac = m[2] ?? "";
  if (frac.length > 18) throw new Error("amount has more than 18 decimal places");
  const padded = frac.padEnd(18, "0");
  return BigInt(whole) * 10n ** 18n + BigInt(padded);
}

export function toBigint(v: bigint | number | Date): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  return BigInt(Math.floor(v.getTime() / 1000));
}

export function toAmountString(v: string | bigint | number): string {
  return typeof v === "string" ? v : v.toString();
}
