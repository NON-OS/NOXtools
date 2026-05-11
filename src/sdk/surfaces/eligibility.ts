import { CAPSULE_TOOLING, eligible, JONOS_PREVIEW, OPERATOR_WAITLIST, type GatePreset } from "../../core/gate.js";
import { tierFor } from "../../core/tier.js";
import { toWei } from "../convert.js";
import type { GateName } from "../types.js";

const GATES: Record<GateName, GatePreset> = {
  "jonos-preview": JONOS_PREVIEW,
  "capsule-tooling": CAPSULE_TOOLING,
  "operator-waitlist": OPERATOR_WAITLIST,
};

export class EligibilitySurface {
  tier(score: bigint): number { return tierFor(score); }
  nox(n: string | number | bigint): number { return tierFor(toWei(n)); }
  gate(name: GateName, score: bigint): boolean { return eligible(score, GATES[name]); }
  gateNox(name: GateName, n: string | number | bigint): boolean { return eligible(toWei(n), GATES[name]); }
  gates(): Record<GateName, GatePreset> { return GATES; }
}
