import { afterEach, describe, expect, it, vi } from "vitest";
import { RpcError, rpcCall, rpcCallValue } from "../src/rpc/index.js";

function jsonResponse(body: unknown, headers: Record<string, string> = { "content-type": "application/json" }): Response {
  return new Response(JSON.stringify(body), { status: 200, headers });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("rpc client hardening", () => {
  it("rejects non-http(s) RPC URLs without touching the network", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    for (const url of ["ws://host", "wss://host", "file:///etc/passwd", "ftp://host", "javascript:alert(1)", "not a url"]) {
      await expect(rpcCall(url, "eth_chainId", [])).rejects.toThrow(/RPC URL|invalid RPC URL/);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("accepts http and https URLs", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ jsonrpc: "2.0", id: 1, result: "0x1" })));
    await expect(rpcCall("http://localhost:8545", "eth_chainId", [])).resolves.toBe("0x1");
    await expect(rpcCall("https://localhost:8545", "eth_chainId", [])).resolves.toBe("0x1");
  });

  it("aborts responses larger than the body cap", async () => {
    const chunk = new Uint8Array(64 * 1024).fill(0x61);
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(chunk); // endless 64 KiB chunks
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(stream, { status: 200, headers: { "content-type": "application/json" } })),
    );
    const err = await rpcCall("http://localhost", "eth_call", []).catch((e) => e);
    expect(err).toBeInstanceOf(RpcError);
    expect(err.message).toMatch(/too large/);
  });

  it("rejects non-JSON content types", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html></html>", { status: 200, headers: { "content-type": "text/html" } })),
    );
    const err = await rpcCall("http://localhost", "eth_call", []).catch((e) => e);
    expect(err).toBeInstanceOf(RpcError);
    expect(err.message).toMatch(/content-type/);
  });

  it("rejects bodies that are not JSON objects", async () => {
    for (const body of ["null", "[1,2,3]", '"str"', "not json at all"]) {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(body, { status: 200, headers: { "content-type": "application/json" } })),
      );
      const err = await rpcCall("http://localhost", "eth_call", []).catch((e) => e);
      expect(err).toBeInstanceOf(RpcError);
    }
  });

  it("does not leak the RPC URL in errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("x", { status: 500 })));
    const secret = "https://user:apikey-supersecret@rpc.example/abc";
    const err = await rpcCall(secret, "eth_call", []).catch((e) => e);
    expect(err).toBeInstanceOf(RpcError);
    expect(String(err.message)).not.toContain("apikey-supersecret");
    expect(String(err.stack ?? "")).not.toContain("apikey-supersecret");
  });

  it("caps hostile rpc error messages and coerces non-string messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ jsonrpc: "2.0", id: 1, error: { message: "x".repeat(100_000) } })),
    );
    const err = await rpcCall("http://localhost", "eth_call", []).catch((e) => e);
    expect(err).toBeInstanceOf(RpcError);
    expect(err.message.length).toBeLessThan(1_000);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ jsonrpc: "2.0", id: 1, error: { message: { evil: true } } })),
    );
    const err2 = await rpcCall("http://localhost", "eth_call", []).catch((e) => e);
    expect(err2.message).toBe("rpc eth_call: unknown");
  });

  it("still passes through revert data for decodeRevert", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ jsonrpc: "2.0", id: 1, error: { message: "execution reverted", data: "0x6855a802" } }),
      ),
    );
    const err = await rpcCall("http://localhost", "eth_call", []).catch((e) => e);
    expect(err.data).toBe("0x6855a802");
  });

  it("treats a __proto__ result key as data, not prototype", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response('{"jsonrpc":"2.0","id":1,"__proto__":{"polluted":true},"result":"0x1"}', {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    await expect(rpcCallValue("http://localhost", "eth_chainId", [])).resolves.toBe("0x1");
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
