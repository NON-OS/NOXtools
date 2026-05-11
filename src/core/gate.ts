import { tierFor } from "./tier.js";

export interface GatePreset {
  id: "jonos-preview" | "capsule-tooling" | "operator-waitlist";
  minTier: number;
}

export const JONOS_PREVIEW: GatePreset = { id: "jonos-preview", minTier: 1 };
export const CAPSULE_TOOLING: GatePreset = { id: "capsule-tooling", minTier: 3 };
export const OPERATOR_WAITLIST: GatePreset = { id: "operator-waitlist", minTier: 4 };

export function eligible(score: bigint, gate: GatePreset): boolean {
  return tierFor(score) >= gate.minTier;
}
