export interface RpcOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

/** Hard cap on RPC response bodies (2 MiB). A malicious node cannot make us buffer more. */
const MAX_BODY_BYTES = 2 * 1024 * 1024;
/** Cap on error strings copied out of untrusted RPC responses. */
const MAX_ERROR_CHARS = 512;
/** Cap on revert data (`error.data`) copied out of untrusted RPC responses. */
const MAX_DATA_CHARS = 262_144;

export class RpcError extends Error {
  constructor(
    readonly method: string,
    readonly code: "http" | "rpc" | "empty" | "timeout",
    message: string,
    /** Raw revert data from the node (`error.data`), if present. Feed to `decodeRevert`. */
    readonly data?: string,
  ) {
    super(`rpc ${method}: ${message}`);
    this.name = "RpcError";
  }
}

export async function rpcCall(
  url: string,
  method: string,
  params: unknown[],
  opts: RpcOptions = {},
): Promise<string> {
  const result = await rpcCallValue(url, method, params, opts);
  if (typeof result !== "string") throw new RpcError(method, "empty", "non-string result");
  return result;
}

export async function rpcCallValue(
  url: string,
  method: string,
  params: unknown[],
  opts: RpcOptions = {},
): Promise<unknown> {
  assertHttpUrl(url);
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const detach = opts.signal ? forwardAbort(opts.signal, controller) : undefined;
  let body: string;
  try {
    let r: Response;
    try {
      r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: controller.signal,
        // Never auto-follow a 3xx: a malicious node / MITM could redirect the
        // POST (body carries method + params) to a second, arbitrary host.
        redirect: "error",
      });
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") {
        throw new RpcError(method, "timeout", `timed out after ${timeoutMs}ms`);
      }
      throw e;
    }
    if (!r.ok) throw new RpcError(method, "http", `HTTP ${r.status}`);
    const contentType = r.headers.get("content-type") ?? "";
    if (contentType !== "" && !/\bjson\b/i.test(contentType)) {
      throw new RpcError(method, "http", "unexpected content-type");
    }
    body = await readBounded(r, method, controller);
  } finally {
    clearTimeout(timeout);
    detach?.();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new RpcError(method, "empty", "response is not valid JSON");
  }
  if (!isPlainRecord(parsed)) throw new RpcError(method, "empty", "response is not a JSON object");
  const j = parsed;
  if (hasOwn(j, "error") && j.error !== null && j.error !== undefined) {
    const err = isPlainRecord(j.error) ? j.error : {};
    const message = typeof err.message === "string" ? err.message.slice(0, MAX_ERROR_CHARS) : "unknown";
    throw new RpcError(method, "rpc", message, errorData(err.data));
  }
  if (!hasOwn(j, "result")) throw new RpcError(method, "empty", "empty result");
  return j.result;
}

async function readBounded(r: Response, method: string, controller: AbortController): Promise<string> {
  const reader = r.body?.getReader();
  if (!reader) {
    // Environment without streaming bodies: fall back to text() (still bounded below).
    const text = await r.text();
    if (text.length > MAX_BODY_BYTES) throw new RpcError(method, "http", "response too large");
    return text;
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        controller.abort();
        throw new RpcError(method, "http", "response too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const merged = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    merged.set(c, off);
    off += c.byteLength;
  }
  return new TextDecoder().decode(merged);
}

function assertHttpUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("invalid RPC URL");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("RPC URL must use http or https");
  }
}

function errorData(value: unknown): string | undefined {
  if (typeof value === "string") return value.slice(0, MAX_DATA_CHARS);
  if (isPlainRecord(value)) {
    const nested = value.data;
    if (typeof nested === "string") return nested.slice(0, MAX_DATA_CHARS);
  }
  return undefined;
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function forwardAbort(signal: AbortSignal, controller: AbortController): () => void {
  const abort = () => controller.abort();
  if (signal.aborted) {
    controller.abort();
    return () => {};
  }
  signal.addEventListener("abort", abort, { once: true });
  return () => signal.removeEventListener("abort", abort);
}
