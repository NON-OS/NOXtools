import { describe, expect, it } from "vitest";
import { buildProof } from "../src/core/proof.js";
import { buildProfile } from "../src/core/profile.js";
import { CAPSULE_TOOLING, eligible, JONOS_PREVIEW, OPERATOR_WAITLIST } from "../src/core/gate.js";
import type { PositionInput } from "../src/core/types.js";

const sample: PositionInput = {
  wallet: "0x1111111111111111111111111111111111111111",
  chainId: 1,
  stakingContract: "0x2222222222222222222222222222222222222222",
  positionId: 9n,
  amount: "1",
  lockUntil: 0n,
  boostBps: 0,
  tier: 0,
  issuedAt: 0n,
};

describe("proof", () => {
  it("bundles receipt, digest, ids, tier, and optional namespace", () => {
    const b = buildProof(sample, "operator.alice");
    expect(b.digest).toMatch(/^0x[0-9a-f]{64}$/);
    expect(b.namespace?.type).toBe("operator");
    expect(b.namespaceHash).toBe(b.namespace?.hash);
  });

  it("omits namespace when none is provided", () => {
    const b = buildProof(sample);
    expect(b.namespace).toBeUndefined();
    expect(b.namespaceHash).toBeUndefined();
  });
});

describe("profile + gates", () => {
  it("builds an operator profile", () => {
    const p = buildProfile(sample, "systems.nonos.demo");
    expect(p.tierName).toBe("Void");
    expect(p.namespace?.type).toBe("system");
  });

  it("evaluates preset gates", () => {
    expect(eligible(0n, JONOS_PREVIEW)).toBe(false);
    expect(eligible(50_000_000_000_000_000_000_000n, CAPSULE_TOOLING)).toBe(true);
    expect(eligible(250_000_000_000_000_000_000_000n, OPERATOR_WAITLIST)).toBe(true);
  });
});
