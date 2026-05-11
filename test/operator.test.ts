import { AbiCoder, keccak256 } from "ethers";
import { describe, expect, it } from "vitest";
import { onchainOperatorId, offchainOperatorId } from "../src/operator.js";
import type { PositionInput } from "../src/types.js";

const base: PositionInput = {
  wallet: "0x1111111111111111111111111111111111111111",
  chainId: 1,
  stakingContract: "0x2222222222222222222222222222222222222222",
  positionId: 7n,
  amount: "0",
  lockUntil: 0n,
  boostBps: 0,
  tier: 0,
  issuedAt: 0n,
};

describe("operator ids", () => {
  it("matches the NOXStakingV4 operatorId ABI preimage", () => {
    const expected = keccak256(
      AbiCoder.defaultAbiCoder().encode(
        ["string", "address", "uint256"],
        ["NOX_OPERATOR_V1", base.wallet, base.positionId],
      ),
    );
    expect(onchainOperatorId(base)).toBe(expected);
  });

  it("accepts zero-based on-chain position ids", () => {
    expect(onchainOperatorId({ ...base, positionId: 0n })).toBe(
      "0xf7e05d479450935e148b74986dbf72f90b19d94802c69ce6bd20ef67ac1e4e6a",
    );
    expect(offchainOperatorId({ ...base, positionId: 0n })).toMatch(/^0x[0-9a-f]{64}$/);
  });
});
