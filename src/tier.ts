export type TierName = "Void" | "Signal" | "Circuit" | "Capsule" | "Operator" | "ZeroState";

const NAMES: readonly TierName[] = ["Void", "Signal", "Circuit", "Capsule", "Operator", "ZeroState"];

const THRESHOLDS: readonly bigint[] = [
  100_000_000_000_000_000_000n,
  1_000_000_000_000_000_000_000n,
  10_000_000_000_000_000_000_000n,
  100_000_000_000_000_000_000_000n,
  1_000_000_000_000_000_000_000_000n,
];

export function tierName(tier: number): TierName {
  return NAMES[tier] ?? "Void";
}

export function tierFor(score: bigint): number {
  let tier = 0;
  for (const t of THRESHOLDS) if (score >= t) tier++;
  return Math.min(tier, 5);
}
