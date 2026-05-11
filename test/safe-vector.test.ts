import { describe, expect, it } from "vitest";
import { TypedDataEncoder } from "ethers";

const SAFE_DOMAIN = {
  chainId: 1,
  verifyingContract: "0x2222222222222222222222222222222222222222",
};

const SAFE_TYPES = {
  SafeTx: [
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "data", type: "bytes" },
    { name: "operation", type: "uint8" },
    { name: "safeTxGas", type: "uint256" },
    { name: "baseGas", type: "uint256" },
    { name: "gasPrice", type: "uint256" },
    { name: "gasToken", type: "address" },
    { name: "refundReceiver", type: "address" },
    { name: "nonce", type: "uint256" },
  ],
};

const SAFE_TX = {
  to: "0x3333333333333333333333333333333333333333",
  value: "0",
  data: "0xdeadbeef",
  operation: 0,
  safeTxGas: "0",
  baseGas: "0",
  gasPrice: "0",
  gasToken: "0x0000000000000000000000000000000000000000",
  refundReceiver: "0x0000000000000000000000000000000000000000",
  nonce: 1,
};

export const CANONICAL_SAFE_TX_HASH =
  "0xc9580b7b1809821a6e048cb995ae2c2cfd89fc88b40f3fdc36caacbf756596a4";

describe("Safe digest cross-check vs ethers TypedDataEncoder", () => {
  it("matches the canonical recorded hash", () => {
    const live = TypedDataEncoder.hash(SAFE_DOMAIN, SAFE_TYPES, SAFE_TX);
    expect(live).toBe(CANONICAL_SAFE_TX_HASH);
  });
});
