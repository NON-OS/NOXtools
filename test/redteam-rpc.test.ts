import { afterEach, describe, expect, it, vi } from "vitest";
import { rpcCall } from "../src/rpc/index.js";
import { txSurface } from "../src/live/tx.js";

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("redteam: single-fetch / only-user-URL invariant", () => {
  it("contacts ONLY the user-supplied URL and exactly once per call", async () => {
    const seen: string[] = [];
    const fetchSpy = vi.fn(async (u: string) => {
      seen.push(u);
      return json({ jsonrpc: "2.0", id: 1, result: "0x1" });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const url = "https://user-node.example/rpc";
    await rpcCall(url, "eth_chainId", []);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([url]);
  });
});

describe("redteam: FIXED - fetch pins redirect:'error'", () => {
  it("sets redirect:'error' so a 3xx from the node/MITM is NOT auto-followed to another host", async () => {
    let init: RequestInit | undefined;
    const fetchSpy = vi.fn(async (_u: string, i: RequestInit) => {
      init = i;
      return json({ jsonrpc: "2.0", id: 1, result: "0x1" });
    });
    vi.stubGlobal("fetch", fetchSpy);

    await rpcCall("https://user-node.example/rpc", "eth_chainId", []);

    // The SDK now pins `redirect:"error"`: runtime fetch (undici in Node >=20)
    // will reject a 307/308 instead of re-sending the POST (body carries
    // method+params: addresses, amounts) to an arbitrary second host, upholding
    // "only the single user-supplied RPC URL is ever contacted".
    expect(init).toBeDefined();
    expect((init as Record<string, unknown>).redirect).toBe("error");
  });
});

describe("redteam: FIXED - receipt is cross-checked against the requested hash", () => {
  it("waitReceipt REJECTS a receipt for a DIFFERENT tx returned by a hostile node", async () => {
    const requested = "0x" + "11".repeat(32);
    const attackerTx = "0x" + "99".repeat(32);

    // Node ignores the requested hash and returns a *successful* receipt for
    // an unrelated transaction. The SDK must not trust it.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        json({
          jsonrpc: "2.0",
          id: 1,
          result: {
            transactionHash: attackerTx,
            status: "0x1",
            blockNumber: "0x10",
            logs: [],
          },
        }),
      ),
    );

    const tx = txSurface("https://user-node.example/rpc");
    await expect(tx.waitReceipt(requested, 1, 50)).rejects.toThrow(/does not match/);
  });

  it("waitReceipt ACCEPTS a matching receipt whose hash differs only in letter case", async () => {
    const requested = "0x" + "ab".repeat(32); // lowercase
    const mixedCase = "0x" + "AB".repeat(32); // node returns uppercase

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        json({
          jsonrpc: "2.0",
          id: 1,
          result: { transactionHash: mixedCase, status: "0x1", blockNumber: "0x10", logs: [] },
        }),
      ),
    );

    const tx = txSurface("https://user-node.example/rpc");
    const receipt = await tx.waitReceipt(requested, 1, 50);
    expect(receipt?.status).toBe("0x1");
    expect(receipt?.transactionHash).toBe(mixedCase);
  });
});

describe("redteam: things that ARE safe (regression guards)", () => {
  it("body cap counts DECODED streamed bytes, aborting a hostile endless stream", async () => {
    const chunk = new Uint8Array(64 * 1024).fill(0x61);
    const stream = new ReadableStream<Uint8Array>({
      pull(c) {
        c.enqueue(chunk);
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(stream, { status: 200, headers: { "content-type": "application/json" } })),
    );
    await expect(rpcCall("http://localhost", "eth_call", [])).rejects.toThrow(/too large/);
  });

  it("never leaks URL/credentials in RpcError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ jsonrpc: "2.0", id: 1, error: { message: "boom" } })));
    const secret = "https://user:APIKEY_SECRET@rpc.example/k";
    const err = await rpcCall(secret, "eth_call", []).catch((e) => e);
    expect(String(err.message) + String(err.stack ?? "")).not.toContain("APIKEY_SECRET");
  });

  it("JSON-RPC envelope cannot pollute Object.prototype", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response('{"jsonrpc":"2.0","id":1,"__proto__":{"pwned":1},"result":"0x1"}', {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    await rpcCall("http://localhost", "eth_chainId", []);
    expect(({} as Record<string, unknown>).pwned).toBeUndefined();
  });
});
