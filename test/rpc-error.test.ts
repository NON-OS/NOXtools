import { afterEach, describe, expect, it, vi } from "vitest";

import { RpcError, rpcCall } from "../src/rpc/index.js";
import { decodeRevert } from "../src/abi/index.js";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RpcError revert data", () => {
  it("carries error.data so callers can decode reverts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          jsonrpc: "2.0",
          id: 1,
          error: { code: 3, message: "execution reverted", data: "0x6855a802" },
        }),
      ),
    );
    const err = await rpcCall("http://localhost", "eth_call", []).catch((e) => e);
    expect(err).toBeInstanceOf(RpcError);
    expect(err.code).toBe("rpc");
    expect(err.data).toBe("0x6855a802");
    expect(decodeRevert(err.data).name).toBe("LockNotExpired");
  });

  it("unwraps nested error.data objects and preserves unknown data raw", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          jsonrpc: "2.0",
          id: 1,
          error: { code: 3, message: "execution reverted", data: { data: "0xdeadbeef" } },
        }),
      ),
    );
    const err = await rpcCall("http://localhost", "eth_call", []).catch((e) => e);
    expect(err).toBeInstanceOf(RpcError);
    expect(err.data).toBe("0xdeadbeef");
    const decoded = decodeRevert(err.data);
    expect(decoded.name).toBeUndefined();
    expect(decoded.raw).toBe("0xdeadbeef");
  });
});
