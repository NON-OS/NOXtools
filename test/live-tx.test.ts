import { describe, expect, it } from "vitest";
import { NoxLive, type PreparedEip1559Tx } from "../src/index.js";
import { MAINNET_DEPLOYMENT } from "../src/deployment/index.js";

function tx(): PreparedEip1559Tx {
  return {
    chainId: 1n,
    from: "0x1111111111111111111111111111111111111111",
    to: "0x2222222222222222222222222222222222222222",
    value: 0n,
    data: "0x",
    nonce: 0n,
    gasLimit: 21_000n,
    maxFeePerGas: 1n,
    maxPriorityFeePerGas: 1n,
  };
}

describe("live tx signer boundary", () => {
  it("rejects signer address mismatch", async () => {
    const live = new NoxLive("https://rpc.invalid", MAINNET_DEPLOYMENT, 1);
    await expect(live.tx.sign({
      address: "0x3333333333333333333333333333333333333333",
      signTransaction: async () => "0x",
    }, tx())).rejects.toThrow("signer address does not match");
  });
});
