import { describe, expect, it } from "vitest";
import { NoxLive, calldata, decodeReceipt, decodeRevert, errorSelector, eventTopic } from "../src/index.js";
import { MAINNET_DEPLOYMENT } from "../src/deployment/index.js";

const word = (n: bigint | number) => BigInt(n).toString(16).padStart(64, "0");
const wordHex = (n: bigint | number) => `0x${word(n)}`;
const topicAddr = (addr: string) => `0x${addr.replace(/^0x/, "").padStart(64, "0")}`;

describe("ABI event and revert decoding", () => {
  it("derives canonical ERC20 topics", () => {
    expect(eventTopic("Transfer(address,address,uint256)")).toBe(
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    );
    expect(eventTopic("Approval(address,address,uint256)")).toBe(
      "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
    );
  });

  it("encodes earlyUnlock calldata with the real selector", () => {
    expect(calldata.staking.earlyUnlock(7n)).toBe(`0x36085c51${word(7)}`);
  });

  it("decodes an EarlyUnlock log with the real topic0", () => {
    const topic0 = "0xdd17c56818d246f980bc6d3e935ecca07dcedd3590d4c9ee62bce59fb89824cc";
    expect(eventTopic("EarlyUnlock(address,uint256,uint256,uint256)")).toBe(topic0);
    const receipt = decodeReceipt({
      logs: [{
        address: "0x0000000000000000000000000000000000000002",
        topics: [topic0, topicAddr("0x1111111111111111111111111111111111111111"), wordHex(3)],
        data: `0x${word(1000)}${word(50)}`,
      }],
    });
    const log = receipt.logs[0];
    expect(log?.name).toBe("EarlyUnlock");
    expect(log?.args[1]?.value).toBe("3");
    expect(log?.args[2]?.value).toBe("1000");
    expect(log?.args[3]?.value).toBe("50");
    expect(log?.raw.data).toBe(`0x${word(1000)}${word(50)}`);
  });

  it("decodes receipt logs and preserves raw receipt", () => {
    const receipt = decodeReceipt({
      transactionHash: "0xabc",
      status: "0x1",
      blockNumber: "0x10",
      gasUsed: "0x5208",
      effectiveGasPrice: "0x3b9aca00",
      logs: [{
        address: "0x0000000000000000000000000000000000000001",
        topics: [
          eventTopic("RewardsCompounded(address,uint256,uint256)"),
          topicAddr("0x1111111111111111111111111111111111111111"),
          wordHex(7),
        ],
        data: wordHex(99),
      }],
    });
    expect(receipt.status).toBe("0x1");
    expect(receipt.logs[0]?.name).toBe("RewardsCompounded");
    expect(receipt.logs[0]?.args[1]?.value).toBe("7");
    expect(receipt.raw).toMatchObject({ transactionHash: "0xabc" });
  });

  it("preserves unknown logs", () => {
    const receipt = decodeReceipt({
      logs: [{ address: "0x0", topics: ["0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"], data: "0x1234" }],
    });
    expect(receipt.logs[0]?.known).toBe(false);
    expect(receipt.logs[0]?.raw.data).toBe("0x1234");
  });

  it("decodes standard and custom reverts", () => {
    let errorString = "0x08c379a0";
    errorString += word(32);
    errorString += word(6);
    errorString += "726576657274";
    errorString += "0".repeat(52);
    expect(decodeRevert(errorString).args[0]?.value).toBe("revert");
    expect(decodeRevert(errorSelector("LockNotExpired()")).name).toBe("LockNotExpired");
    expect(decodeRevert("0xdeadbeef")).toMatchObject({ known: false, raw: "0xdeadbeef" });
  });
});

describe("SDK endpoint plan", () => {
  it("reports endpoint posture without network I/O", () => {
    const live = new NoxLive("https://rpc.invalid", MAINNET_DEPLOYMENT, 1);
    expect(live.tx.privacyReport(false)).toEqual({
      schemaVersion: 1,
      rpcEndpoint: "https://rpc.invalid",
      networkCalls: false,
      fallbackRpc: null,
      telemetry: false,
    });
  });
});
