import { describe, expect, it } from "vitest";
import {
  decodeAddress,
  decodeReceipt,
  decodeRevert,
  decodeString,
  decodeUint256,
  decodeWords,
  errorSelector,
} from "../src/abi/index.js";
import { decodeLog, eventTopic } from "../src/abi/events.js";

const word = (n: bigint | number) => BigInt(n).toString(16).padStart(64, "0");

describe("decode hardening: malicious return data", () => {
  it("rejects absurd string offsets instead of decoding garbage", () => {
    // offset points far past the payload
    const evil = `0x${word(2n ** 250n)}${word(5)}`;
    expect(() => decodeString(evil)).toThrow(/offset out of bounds/);
  });

  it("rejects string lengths larger than the payload", () => {
    const evil = `0x${word(32)}${word(10_000_000)}`;
    expect(() => decodeString(evil)).toThrow(/too long/);
  });

  it("rejects string length just past the payload end", () => {
    // offset 32, claims 33 bytes but only 32 present
    const evil = `0x${word(32)}${word(33)}${"61".repeat(32)}`;
    expect(() => decodeString(evil)).toThrow(/out of bounds/);
  });

  it("rejects non-word-aligned string offsets", () => {
    const evil = `0x${word(31)}${word(1)}${"61".repeat(32)}`;
    expect(() => decodeString(evil)).toThrow(/offset out of bounds/);
  });

  it("still decodes a legitimate string", () => {
    const hex = `0x${word(32)}${word(5)}${Buffer.from("hello").toString("hex").padEnd(64, "0")}`;
    expect(decodeString(hex)).toBe("hello");
  });

  it("handles a self-overlapping offset without blowup", () => {
    // offset 0 points back at the offset word itself: len decodes to 0 -> empty string, no crash
    const overlapping = `0x${word(0)}${word(0)}`;
    expect(decodeString(overlapping)).toBe("");
  });

  it("rejects invalid hex that parseInt would have silently accepted", () => {
    expect(() => decodeUint256(`0x${"1g".repeat(32)}`)).toThrow(/invalid hex/);
  });

  it("rejects uint256 words that are not exactly 32 bytes", () => {
    expect(() => decodeUint256("0x")).toThrow();
    expect(() => decodeUint256(`0x${word(1)}${word(2)}`)).toThrow(/invalid uint256/);
  });

  it("rejects address words with dirty upper bytes (silent truncation)", () => {
    const dirty = `0x${"ff".repeat(12)}${"11".repeat(20)}`;
    expect(() => decodeAddress(dirty)).toThrow(/dirty upper bytes/);
    expect(decodeAddress(`0x${word(0x1234)}`)).toBe(`0x${"0".repeat(36)}1234`);
  });

  it("caps decodeWords length", () => {
    const evil = `0x${"00".repeat(32 * 5_000)}`;
    expect(() => decodeWords(evil)).toThrow(/too many words/);
  });

  it("rejects hex payloads beyond the global cap (10MB string)", () => {
    const huge = `0x${"ab".repeat(5 * 1024 * 1024)}`; // 10 MiB of hex chars = 5 MiB of bytes
    expect(() => decodeWords(huge)).toThrow(/too large/);
  });

  it("rejects revert strings with hostile offsets/lengths as unknown", () => {
    const sel = errorSelector("Error(string)").slice(2);
    const hostileOffset = `0x${sel}${word(2n ** 200n)}${word(1)}`;
    expect(decodeRevert(hostileOffset).known).toBe(false);
    const hostileLen = `0x${sel}${word(32)}${word(2n ** 200n)}`;
    expect(decodeRevert(hostileLen).known).toBe(false);
    // sane revert still decodes
    const ok = `0x${sel}${word(32)}${word(2)}${Buffer.from("no").toString("hex").padEnd(64, "0")}`;
    expect(decodeRevert(ok).args[0]?.value).toBe("no");
  });

  it("marks logs with dirty indexed address topics as unknown instead of truncating", () => {
    const topic0 = eventTopic("Transfer(address,address,uint256)");
    const dirty = `0x${"ff".repeat(12)}${"11".repeat(20)}`;
    const clean = `0x${word(0x22)}`;
    const log = decodeLog({ address: "0x", topics: [topic0, dirty, clean], data: `0x${word(1)}` });
    expect(log.known).toBe(false);
  });

  it("rejects receipts with an absurd number of logs", () => {
    const logs = new Array(10_001).fill({ address: "0x", topics: [], data: "0x" });
    expect(() => decodeReceipt({ logs })).toThrow(/too many logs/);
  });

  it("ignores extra hostile topics beyond the ABI maximum", () => {
    const topic0 = eventTopic("Unstaked(address,uint256)");
    const receipt = decodeReceipt({
      logs: [{
        address: "0x0000000000000000000000000000000000000001",
        topics: [topic0, `0x${word(0x11)}`, ...new Array(100).fill(`0x${word(0xff)}`)],
        data: `0x${word(9)}`,
      }],
    });
    expect(receipt.logs[0]?.name).toBe("Unstaked");
    expect(receipt.logs[0]?.args[1]?.value).toBe("9");
  });
});
