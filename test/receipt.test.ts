import { describe, expect, it } from "vitest";
import { makeReceipt, receiptDigest, verifyReceiptShape } from "../src/receipt.js";
import type { PositionInput } from "../src/types.js";

const sample: PositionInput = {
  wallet: "0x1111111111111111111111111111111111111111",
  chainId: 1,
  stakingContract: "0x2222222222222222222222222222222222222222",
  positionId: 42n,
  amount: "1000000000000000000",
  lockUntil: 1_900_000_000n,
  boostBps: 1500,
  tier: 3,
  issuedAt: 1_700_000_000n,
};

describe("receipt", () => {
  it("carries both operator ids", () => {
    const r = makeReceipt(sample);
    expect(r.onchainOperatorId).toMatch(/^0x[0-9a-f]{64}$/);
    expect(r.offchainOperatorId).toMatch(/^0x[0-9a-f]{64}$/);
    expect(r.onchainOperatorId).not.toBe(r.offchainOperatorId);
  });

  it("digest is deterministic and shape-checks", () => {
    const r = makeReceipt(sample);
    expect(receiptDigest(r)).toBe(receiptDigest(makeReceipt(sample)));
    expect(verifyReceiptShape(r)).toBe(true);
    expect(verifyReceiptShape({})).toBe(false);
  });

  it("digest changes when fields change", () => {
    const a = receiptDigest(makeReceipt(sample));
    const b = receiptDigest(makeReceipt({ ...sample, amount: "2000000000000000000" }));
    expect(a).not.toBe(b);
  });
});
