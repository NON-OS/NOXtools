import { describe, expect, it } from "vitest";
import { calldata, makeReceipt, receiptDigest } from "../src/index.js";
import { encodeAddress, encodeUint256, packCall } from "../src/abi/index.js";
import { toWei } from "../src/sdk/convert.js";
import type { StakeReceipt } from "../src/core/types.js";

const UINT256_MAX = (1n << 256n) - 1n;

describe("calldata input hardening", () => {
  it("rejects malformed addresses loudly", () => {
    for (const bad of [
      "1111111111111111111111111111111111111111", // missing 0x
      "0x111111111111111111111111111111111111111", // 39 chars
      "0x11111111111111111111111111111111111111111", // 41 chars
      "0x1g11111111111111111111111111111111111111", // invalid hex digit
      "0x", "", "0x0",
    ]) {
      expect(() => calldata.token.approve(bad, 1n)).toThrow(/invalid address/);
      expect(() => encodeAddress(bad)).toThrow(/invalid address/);
    }
  });

  it("rejects negative and overflowing uint256 amounts instead of wrapping", () => {
    expect(() => calldata.staking.stake(-1n)).toThrow(/negative/);
    expect(() => calldata.staking.stake(UINT256_MAX + 1n)).toThrow(/overflow/);
    expect(() => encodeUint256(-1n)).toThrow(/negative/);
    expect(calldata.staking.stake(UINT256_MAX)).toContain("f".repeat(64));
  });

  it("emits exactly selector + n*32 bytes", () => {
    expect(calldata.staking.stake(1n)).toHaveLength(10 + 64);
    expect(calldata.staking.stakeLocked(1n, 2n)).toHaveLength(10 + 128);
    expect(calldata.token.approve("0x1111111111111111111111111111111111111111", 1n)).toHaveLength(10 + 128);
    expect(calldata.staking.claimRewards()).toHaveLength(10);
  });

  it("packCall rejects malformed selectors and words", () => {
    expect(() => packCall("0x123", ["00".repeat(32)])).toThrow(/invalid selector/);
    expect(() => packCall("0xa694fc3a", ["1234"])).toThrow(/invalid abi word/);
    expect(() => packCall("0xa694fc3a", [`${"00".repeat(31)}zz`])).toThrow(/invalid abi word/);
  });

  it("rejects invalid namespaces before hashing", () => {
    expect(() => calldata.namespace.reserve("evil.example", 1n)).toThrow(/invalid namespace/);
    expect(() => calldata.namespace.reserve("operator.UPPER_bad!", 1n)).toThrow(/invalid namespace/);
    expect(() => calldata.namespace.reserve(`operator.${"a".repeat(120)}`, 1n)).toThrow(/invalid namespace/);
    expect(calldata.namespace.reserve("operator.alice", 7n)).toHaveLength(10 + 128);
  });
});

describe("amount conversion hardening", () => {
  it("rejects malformed amount strings instead of silently truncating", () => {
    expect(() => toWei("1.2.3")).toThrow(/invalid amount/);
    expect(() => toWei("1e18")).toThrow(/invalid amount/);
    expect(() => toWei("-5")).toThrow(/invalid amount/);
    expect(() => toWei("0x10")).toThrow(/invalid amount/);
    expect(() => toWei("1.0000000000000000001")).toThrow(/decimal places/);
    expect(toWei("1.5")).toBe(1_500_000_000_000_000_000n);
    expect(toWei("2")).toBe(2_000_000_000_000_000_000n);
  });

  it("rejects non-integer and negative number amounts", () => {
    expect(() => toWei(1.5)).toThrow(/non-negative integer/);
    expect(() => toWei(-1)).toThrow(/non-negative integer/);
  });
});

describe("receipt digest injection hardening", () => {
  const base = {
    wallet: "0x1111111111111111111111111111111111111111",
    chainId: 1,
    stakingContract: "0x2222222222222222222222222222222222222222",
    positionId: 42n,
    amount: "1000",
    lockUntil: 1n,
    boostBps: 0,
    tier: 0,
    issuedAt: 1n,
  };

  it("rejects pipe-injection through the amount field", () => {
    const r = makeReceipt(base);
    const evil: StakeReceipt = { ...r, amount: "1000|9999" };
    expect(() => receiptDigest(evil)).toThrow(/invalid amount/);
  });

  it("rejects non-address wallet/stakingContract fields", () => {
    const r = makeReceipt(base);
    expect(() => receiptDigest({ ...r, wallet: "evil|field" })).toThrow(/invalid wallet/);
    expect(() => receiptDigest({ ...r, stakingContract: "0xzz" })).toThrow(/invalid staking contract/);
    expect(() => receiptDigest({ ...r, onchainOperatorId: "x|y" })).toThrow(/operator id/);
  });

  it("still digests well-formed receipts deterministically", () => {
    const r = makeReceipt(base);
    expect(receiptDigest(r)).toBe(receiptDigest(makeReceipt(base)));
  });
});
