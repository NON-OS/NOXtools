import { describe, expect, it } from "vitest";
import { TypedDataEncoder } from "ethers";
import { onchainOperatorId, offchainOperatorId } from "../src/operator.js";
import type { PositionInput } from "../src/types.js";

const POS: PositionInput = {
  wallet: "0x1111111111111111111111111111111111111111",
  chainId: 1,
  stakingContract: "0x2222222222222222222222222222222222222222",
  positionId: 42n,
  amount: "1000000000000000000",
  lockUntil: 1900000000n,
  boostBps: 1500,
  tier: 3,
  issuedAt: 1700000000n,
};

const DOMAIN = {
  name: "NOX Operator Kit",
  version: "1",
  chainId: 1,
  verifyingContract: POS.stakingContract,
};

const TYPES = {
  NoxStakeReceipt: [
    { name: "wallet", type: "address" },
    { name: "chainId", type: "uint256" },
    { name: "stakingContract", type: "address" },
    { name: "positionId", type: "uint256" },
    { name: "amount", type: "uint256" },
    { name: "lockUntil", type: "uint256" },
    { name: "boostBps", type: "uint32" },
    { name: "tier", type: "uint8" },
    { name: "issuedAt", type: "uint256" },
    { name: "onchainOperatorId", type: "bytes32" },
    { name: "offchainOperatorId", type: "bytes32" },
  ],
};

export const CANONICAL_ONCHAIN_ID =
  "0x454aa5f7e481c83fea729308e1e3f07058984bac4780fa3597cfe5565e78d781";
export const CANONICAL_OFFCHAIN_ID =
  "0x3dfd79efa11fa1feb1aa272e5c5740ddc9913d00cee04693e57eac0a4b124bb1";
export const CANONICAL_RECEIPT_HASH =
  "0x8821e40e16f0a2b89d7d95338e431f3d745c4d428f84ac6387998d87780f85b7";

describe("NoxStakeReceipt cross-check vs ethers TypedDataEncoder", () => {
  it("operator ids match canonical values", () => {
    expect(onchainOperatorId(POS)).toBe(CANONICAL_ONCHAIN_ID);
    expect(offchainOperatorId(POS)).toBe(CANONICAL_OFFCHAIN_ID);
  });

  it("typed-data digest matches the canonical recorded hash", () => {
    const msg = {
      ...POS,
      onchainOperatorId: CANONICAL_ONCHAIN_ID,
      offchainOperatorId: CANONICAL_OFFCHAIN_ID,
    };
    expect(TypedDataEncoder.hash(DOMAIN, TYPES, msg)).toBe(CANONICAL_RECEIPT_HASH);
  });
});
