import { afterEach, describe, expect, it, vi } from "vitest";
import { NoxLive } from "../src/index.js";
import { MAINNET_DEPLOYMENT } from "../src/deployment/index.js";

const live = () => new NoxLive("https://rpc.invalid", MAINNET_DEPLOYMENT, 1);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("live tx surface hardening", () => {
  it("keeps rejecting signer/from mismatch case-insensitively", async () => {
    const tx = {
      chainId: 1n,
      from: "0x1111111111111111111111111111111111111111" as const,
      to: "0x2222222222222222222222222222222222222222" as const,
      value: 0n,
      data: "0x" as const,
      nonce: 0n,
      gasLimit: 21_000n,
      maxFeePerGas: 1n,
      maxPriorityFeePerGas: 1n,
    };
    await expect(
      live().tx.sign({ address: "0x3333333333333333333333333333333333333333", signTransaction: async () => "0x" }, tx),
    ).rejects.toThrow("signer address does not match");
    // same address, different case: allowed
    await expect(
      live().tx.sign(
        { address: "0x1111111111111111111111111111111111111111".toUpperCase().replace("0X", "0x") as `0x${string}`, signTransaction: async () => "0xdeadbeef" },
        tx,
      ),
    ).resolves.toBe("0xdeadbeef");
  });

  it("broadcast requires 0x-prefixed raw hex bytes", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    for (const bad of ["deadbeef", "0x", "0xabc", "0xzz", ""]) {
      await expect(live().tx.broadcast(bad as `0x${string}`)).rejects.toThrow(/raw transaction/);
      await expect(live().tx.sendAndWait(bad as `0x${string}`)).rejects.toThrow(/raw transaction/);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects oversized raw transactions", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const huge = (`0x${"ab".repeat(200_000)}`) as `0x${string}`;
    await expect(live().tx.broadcast(huge)).rejects.toThrow(/too large/);
  });

  it("bounds waitReceipt polls and delay", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const hash = `0x${"11".repeat(32)}`;
    await expect(live().tx.waitReceipt(hash, 0)).rejects.toThrow(/polls/);
    await expect(live().tx.waitReceipt(hash, 1e9)).rejects.toThrow(/polls/);
    await expect(live().tx.waitReceipt(hash, 2.5)).rejects.toThrow(/polls/);
    await expect(live().tx.waitReceipt(hash, 1, -1)).rejects.toThrow(/delayMs/);
    await expect(live().tx.waitReceipt(hash, 1, 10_000_000)).rejects.toThrow(/delayMs/);
    await expect(live().tx.waitReceipt("not-a-hash", 1)).rejects.toThrow(/transaction hash/);
  });

  it("prepare validates from/to/data before any network call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const good = "0x1111111111111111111111111111111111111111" as `0x${string}`;
    await expect(live().tx.prepare("bad" as `0x${string}`, good, "0x")).rejects.toThrow(/invalid from address/);
    await expect(live().tx.prepare(good, "0x123" as `0x${string}`, "0x")).rejects.toThrow(/invalid to address/);
    await expect(live().tx.prepare(good, good, "0xabc" as `0x${string}`)).rejects.toThrow(/invalid data hex/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
