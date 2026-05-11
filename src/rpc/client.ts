export async function rpcCall(url: string, method: string, params: unknown[]): Promise<string> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!r.ok) throw new Error(`rpc ${method}: HTTP ${r.status}`);
  const j = (await r.json()) as { result?: string; error?: { message?: string } };
  if (j.error) throw new Error(`rpc ${method}: ${j.error.message ?? "unknown"}`);
  if (typeof j.result !== "string") throw new Error(`rpc ${method}: empty result`);
  return j.result;
}
