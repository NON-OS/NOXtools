import { describe, expect, it } from "vitest";
import { normalizeNamespace, namespaceHash, namespaceType } from "../src/core/namespace.js";
import * as calldata from "../src/calldata/index.js";
import { toWei } from "../src/sdk/convert.js";
import { encodeUint256, encodeAddress } from "../src/abi/encode.js";
import { onchainOperatorId, offchainOperatorId } from "../src/core/operator.js";
import { receiptDigest } from "../src/core/receipt.js";
import type { StakeReceipt } from "../src/core/types.js";

// ---------------------------------------------------------------------------
// FIXED 1 (CRITICAL): Namespace Unicode homoglyph collision.
//
// Old TS normalizeNamespace() ran FULL Unicode `.toLowerCase()` and THEN checked
// the charset, so U+212A KELVIN SIGN (folds to ASCII "k") smuggled a non-ASCII
// byte through, colliding "operator.<KELVIN>ey" with "operator.key".
// crates/nox-core/src/namespace.rs runs `.to_ascii_lowercase()` and checks each
// RAW byte is ascii. TS now ASCII-lowercases only, so the charset regex rejects
// the non-ASCII byte up front - matching Rust's InvalidNamespace.
// ---------------------------------------------------------------------------
describe("FIXED 1: namespace homoglyph collision (TS now matches Rust)", () => {
  const KELVIN = "K"; // KELVIN SIGN, lowercases to "k" under full-Unicode fold
  const evil = "operator." + KELVIN + "ey"; // looks like "operator.key"
  const benign = "operator.key";

  it("input carries a non-ASCII byte -> rejected, matching Rust InvalidNamespace", () => {
    // Rust checks raw bytes: name.bytes().all(is_ascii...). KELVIN is 0xE2 0x84 0xAA.
    const bytes = new TextEncoder().encode(evil);
    expect([...bytes].some((b) => b > 0x7f)).toBe(true);
    expect(() => normalizeNamespace(evil)).toThrow();
    expect(() => namespaceHash(evil)).toThrow();
    expect(() => namespaceType(evil)).toThrow();
    expect(() => calldata.namespace.reserve(evil, 1n)).toThrow();
  });

  it("the benign homograph target still normalizes/hashes normally", () => {
    expect(normalizeNamespace(benign)).toBe("operator.key");
    expect(namespaceType(benign)).toBe("operator");
  });

  it("uppercase ASCII is still ASCII-lowercased (matches Rust to_ascii_lowercase)", () => {
    expect(normalizeNamespace("operator.KEY")).toBe("operator.key");
    expect(namespaceHash("operator.KEY")).toBe(namespaceHash("operator.key"));
  });

  it("BYTE-IDENTITY: a normal namespace hashes to the exact same digest as before", () => {
    // Hardcoded from the pre-fix implementation for "operator.key".
    expect(namespaceHash("operator.key")).toBe(
      "0xccbc784f47f80eb085e9bf84c5cc34ba5e06d196a7f8c6d8d2e71b09d9e4fdf2",
    );
  });
});

// ---------------------------------------------------------------------------
// FIXED 2 (MEDIUM): onchainOperatorId used to accept positionId > u64::MAX.
// Rust models position_id as u64 and encodes word_u64(position_id)
// (crates/nox-core/src/operator.rs). TS now bounds positionId to u64 as well;
// for every in-range id the encoded 32-byte word (and digest) is byte-identical.
// ---------------------------------------------------------------------------
describe("FIXED 2: onchainOperatorId bounds positionId to u64", () => {
  const base = {
    wallet: "0x1111111111111111111111111111111111111111",
    chainId: 1,
    stakingContract: "0x2222222222222222222222222222222222222222",
    amount: "0",
    lockUntil: 0n,
    boostBps: 0,
    tier: 0,
    issuedAt: 0n,
  };

  it("onchain now rejects a positionId that overflows u64 (like offchain)", () => {
    const overU64 = (1n << 64n) + 5n; // > u64::MAX
    expect(() => onchainOperatorId({ ...base, positionId: overU64 })).toThrow();
    expect(() => offchainOperatorId({ ...base, positionId: overU64 })).toThrow();
  });

  it("BYTE-IDENTITY: an in-range positionId yields the exact same operator id as before", () => {
    // Hardcoded from the pre-fix u256 encoding for positionId=7.
    expect(onchainOperatorId({ ...base, positionId: 7n })).toBe(
      "0x489f880c923b16ebf890ba860afc77b8213411032cc2e5dc3ca5f896f6a2ed79",
    );
  });
});

// ---------------------------------------------------------------------------
// FIXED 3 (LOW/MEDIUM): receiptDigest now enforces the Rust type domains
// (tier u8, boostBps u32, chainId/positionId/lockUntil/issuedAt u64) from
// crates/nox-core/src/types.rs. Out-of-domain values are rejected; the digest
// string format and output for valid receipts are unchanged.
// ---------------------------------------------------------------------------
describe("FIXED 3: receiptDigest enforces integer field domains", () => {
  const r = (over: Partial<StakeReceipt>): StakeReceipt => ({
    wallet: "0x1111111111111111111111111111111111111111",
    chainId: 1,
    stakingContract: "0x2222222222222222222222222222222222222222",
    positionId: 1n,
    amount: "1",
    lockUntil: 0n,
    boostBps: 0,
    tier: 0,
    issuedAt: 0n,
    onchainOperatorId: "0x" + "00".repeat(32),
    offchainOperatorId: "0x" + "11".repeat(32),
    ...over,
  });

  it("tier=256 (out of u8) is rejected", () => {
    expect(() => receiptDigest(r({ tier: 256 }))).toThrow();
  });
  it("boostBps=2**32 (out of u32) is rejected", () => {
    expect(() => receiptDigest(r({ boostBps: 2 ** 32 }))).toThrow();
  });
  it("positionId=2**64 (out of u64) is rejected", () => {
    expect(() => receiptDigest(r({ positionId: 1n << 64n }))).toThrow();
  });
  it("negative fields are rejected", () => {
    expect(() => receiptDigest(r({ tier: -1 }))).toThrow();
    expect(() => receiptDigest(r({ boostBps: -1 }))).toThrow();
    expect(() => receiptDigest(r({ positionId: -1n }))).toThrow();
    expect(() => receiptDigest(r({ lockUntil: -1n }))).toThrow();
    expect(() => receiptDigest(r({ issuedAt: -1n }))).toThrow();
  });

  it("BYTE-IDENTITY: a known-good receipt digests to the exact same value as before", () => {
    // Hardcoded from the pre-fix implementation for positionId=7 baseline receipt.
    const good = r({ positionId: 7n });
    expect(receiptDigest(good)).toBe(
      "0x87407b739b79d716ba03e8d6355560bf69f7cc89ead9314fab5def68084a7270",
    );
  });
});

// ---------------------------------------------------------------------------
// DEFENDED: things that were attacked and correctly rejected / handled.
// ---------------------------------------------------------------------------
describe("DEFENDED: amount / uint / address parsing", () => {
  it("toWei rejects scientific notation, whitespace, separators, hex, unicode, negative", () => {
    for (const bad of ["1e18", " 1 ", "1_000", "0x10", "١", "-1", "+1", "1.5.0", ""]) {
      expect(() => toWei(bad)).toThrow();
    }
  });
  it("toWei rejects >18 decimal places instead of truncating", () => {
    expect(() => toWei("1.5000000000000000009")).toThrow();
  });
  it("toWei parses decimals correctly", () => {
    expect(toWei("1.5")).toBe(1_500_000_000_000_000_000n);
  });
  it("encodeUint256 rejects negative and overflow", () => {
    expect(() => encodeUint256(-1n)).toThrow();
    expect(() => encodeUint256(1n << 256n)).toThrow();
  });
  it("encodeAddress rejects embedded whitespace / short / non-hex", () => {
    for (const bad of ["0x 111111111111111111111111111111111111111", "0x111", "0xZZ11111111111111111111111111111111111111"]) {
      expect(() => encodeAddress(bad)).toThrow();
    }
  });
  it("receiptDigest rejects '|' delimiter injection in amount", () => {
    const r: StakeReceipt = {
      wallet: "0x1111111111111111111111111111111111111111",
      chainId: 1,
      stakingContract: "0x2222222222222222222222222222222222222222",
      positionId: 1n,
      amount: "1|2",
      lockUntil: 0n,
      boostBps: 0,
      tier: 0,
      issuedAt: 0n,
      onchainOperatorId: "0x" + "00".repeat(32),
      offchainOperatorId: "0x" + "11".repeat(32),
    };
    expect(() => receiptDigest(r)).toThrow();
  });
});
