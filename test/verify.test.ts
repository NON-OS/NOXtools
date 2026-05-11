import { describe, expect, it } from "vitest";
import { buildProof } from "../src/core/proof.js";
import { verifyReceipt } from "../src/core/verify.js";
import type { PositionInput } from "../src/core/types.js";

const sample: PositionInput = {
  wallet: "0x1111111111111111111111111111111111111111",
  chainId: 1,
  stakingContract: "0x2222222222222222222222222222222222222222",
  positionId: 7n,
  amount: "1000000000000000000",
  lockUntil: 1_900_000_000n,
  boostBps: 1500,
  tier: 3,
  issuedAt: 1_700_000_000n,
};

describe("verify", () => {
  it("verifies a fresh proof bundle", () => {
    const bundle = buildProof(sample);
    const r = verifyReceipt(bundle.receipt, bundle.digest);
    expect(r.valid).toBe(true);
    expect(r.checks.onchainOperatorId).toBe(true);
    expect(r.checks.offchainOperatorId).toBe(true);
    expect(r.checks.digest).toBe(true);
  });

  it("flags a tampered receipt", () => {
    const bundle = buildProof(sample);
    const tampered = { ...bundle.receipt, onchainOperatorId: "0x" + "ff".repeat(32) };
    const r = verifyReceipt(tampered);
    expect(r.valid).toBe(false);
    expect(r.checks.onchainOperatorId).toBe(false);
  });

  it("flags a wrong digest", () => {
    const bundle = buildProof(sample);
    const r = verifyReceipt(bundle.receipt, "0x" + "00".repeat(32));
    expect(r.valid).toBe(false);
    expect(r.checks.digest).toBe(false);
  });
});
