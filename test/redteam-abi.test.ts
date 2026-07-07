import { describe, expect, it } from "vitest";
import { decodeReceipt, decodeRevert, errorSelector } from "../src/abi/index.js";
import { decodeLog, decodeLogValue, eventTopic } from "../src/abi/events.js";

const word = (n: bigint | number) => BigInt(n).toString(16).padStart(64, "0");
const U256_MAX = (2n ** 256n - 1n).toString();

/**
 * RED TEAM. Every input below is what a FULLY MALICIOUS RPC node can return
 * from eth_getLogs / eth_getTransactionReceipt / eth_call. A dapp reaches these
 * decoders through live.tx.decodeLog(log), live.tx.decodeReceipt(r),
 * live.tx.waitReceipt()/sendAndWait() (-> decodeReceipt), live.tx.decodeRevert(d).
 */
describe("RED TEAM: abi decode layer", () => {
  // ---------------------------------------------------------------------------
  // FIXED (was EXPLOIT 1, CRASH / DoS): live.tx.decodeLog now routes its input
  // through the same rawLog() sanitizer decodeLogValue uses, so a hostile log
  // whose `topics` is missing / not an array / contains a non-string returns the
  // documented graceful { known:false } instead of an uncaught TypeError.
  // ---------------------------------------------------------------------------
  it("FIXED-1a decodeLog: missing topics -> known:false (no throw)", () => {
    // eth_getLogs entry with no `topics` field at all.
    const hostile = { address: "0x0000000000000000000000000000000000000001", data: "0x" } as any;
    expect(() => decodeLog(hostile)).not.toThrow();
    expect(decodeLog(hostile).known).toBe(false);
  });

  it("FIXED-1b decodeLog: numeric topic0 -> known:false (no throw)", () => {
    const hostile = { address: "0x", topics: [42], data: "0x" } as any;
    expect(() => decodeLog(hostile)).not.toThrow();
    expect(decodeLog(hostile).known).toBe(false);
  });

  it("FIXED-1c decodeLog: object topic0 -> known:false (no throw)", () => {
    const hostile = { address: "0x", topics: [{ evil: true }], data: "0x" } as any;
    expect(() => decodeLog(hostile)).not.toThrow();
    expect(decodeLog(hostile).known).toBe(false);
  });

  it("FIXED-1d decodeLog: topics is a string (not array) -> known:false", () => {
    // JSON is fully attacker controlled; topics need not be an array. Both the
    // raw and the *Value entry points now sanitize identically.
    const hostile = { address: "0x", topics: "0xdeadbeef", data: "0x" } as any;
    expect(() => decodeLogValue(hostile)).not.toThrow();
    expect(() => decodeLog(hostile)).not.toThrow();
    expect(decodeLog(hostile).known).toBe(false);
    expect(decodeLogValue(hostile).known).toBe(false);
  });

  it("FIXED-1e decodeLog: a valid known log still decodes correctly", () => {
    const topic0 = eventTopic("Staked(address,uint256,uint256)");
    const user = `0x${"00".repeat(12)}${"11".repeat(20)}`;
    const log = decodeLog({
      address: "0x0000000000000000000000000000000000000001",
      topics: [topic0, user],
      data: `0x${word(100)}${word(250)}`,
    });
    expect(log.known).toBe(true);
    expect(log.name).toBe("Staked");
    expect(log.args[0]?.value).toBe(`0x${"11".repeat(20)}`);
    expect(log.args[1]?.value).toBe("100");
    expect(log.args[2]?.value).toBe("250");
  });

  // ---------------------------------------------------------------------------
  // FIXED (was EXPLOIT 2, SILENT CORRUPTION): fixed uintN event args are now
  // masked to the type width (ABI-correct, matches ethers/viem). A uint8 flag
  // with dirty upper bytes decodes to its low byte, not a 78-digit number.
  // ---------------------------------------------------------------------------
  it("FIXED-2 uint8 flag with dirty high bytes masks to the low byte (0..255)", () => {
    const topic0 = eventTopic("AccessGranted(address,uint8)");
    const cleanWallet = `0x${"00".repeat(12)}${"11".repeat(20)}`; // valid address topic
    const dirtyFlag = `0x${"ff".repeat(32)}`;                     // uint8 with dirty upper bytes
    const log = decodeLog({
      address: "0x0000000000000000000000000000000000000001",
      topics: [topic0, cleanWallet, dirtyFlag],
      data: "0x",
    });
    expect(log.known).toBe(true);
    expect(log.args[1]?.kind).toBe("uint8");
    // MASKED: uint8 low byte of 0xff..ff is 0xff = 255. Not the max uint256.
    expect(log.args[1]?.value).toBe("255");
    expect(log.args[1]?.value).not.toBe(U256_MAX);

    // Same masking via the real dapp path: waitReceipt -> decodeReceipt.
    const receipt = decodeReceipt({
      logs: [{ address: "0x0000000000000000000000000000000000000001", topics: [topic0, cleanWallet, dirtyFlag], data: "0x" }],
    });
    expect(receipt.logs[0]?.args[1]?.value).toBe("255");
  });

  it("FIXED-2 byte-identity: a clean uint8 flag decodes unchanged; uint256 never masked", () => {
    const topic0 = eventTopic("AccessGranted(address,uint8)");
    const cleanWallet = `0x${"00".repeat(12)}${"11".repeat(20)}`;
    // Clean uint8 = 7 -> "7" (byte-identical to pre-fix behavior for valid data).
    const cleanFlag = `0x${word(7)}`;
    const log = decodeLog({ address: "0x", topics: [topic0, cleanWallet, cleanFlag], data: "0x" });
    expect(log.args[1]?.value).toBe("7");

    // A genuine uint256 arg still returns the full width (masking must NOT apply).
    const staked = decodeLog({
      address: "0x",
      topics: [eventTopic("Staked(address,uint256,uint256)"), cleanWallet],
      data: `0x${"ff".repeat(32)}${word(1)}`,
    });
    expect(staked.args[1]?.value).toBe(U256_MAX); // uint256 unmasked
  });

  // ---------------------------------------------------------------------------
  // FIXED (was EXPLOIT 3, SILENT CORRUPTION): revert.ts now shares one address
  // -word helper with decode.ts/events.ts, so a dirty-upper-bytes address arg is
  // rejected (known:false) instead of silently truncated to the low 20 bytes.
  // ---------------------------------------------------------------------------
  it("FIXED-3 decodeRevert: dirty address word is rejected (known:false)", () => {
    const sel = errorSelector("ERC20InsufficientBalance(address,uint256,uint256)").slice(2);
    const dirtySender = `${"ff".repeat(12)}${"11".repeat(20)}`; // 32B, dirty upper 12
    const data = `0x${sel}${dirtySender}${word(5)}${word(9)}`;
    const r = decodeRevert(data);
    expect(r.known).toBe(false);
  });

  it("FIXED-3 decodeRevert: a clean address arg still decodes identically", () => {
    const sel = errorSelector("ERC20InsufficientBalance(address,uint256,uint256)").slice(2);
    const cleanSender = `${"00".repeat(12)}${"11".repeat(20)}`;
    const data = `0x${sel}${cleanSender}${word(5)}${word(9)}`;
    const r = decodeRevert(data);
    expect(r.known).toBe(true);
    expect(r.name).toBe("ERC20InsufficientBalance");
    expect(r.args[0]?.value).toBe(`0x${"11".repeat(20)}`);
    expect(r.args[1]?.value).toBe("5");
    expect(r.args[2]?.value).toBe("9");
  });
});
