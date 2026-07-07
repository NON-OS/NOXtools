/** Hard cap on accepted hex payloads (2 MiB of bytes). Matches the RPC body cap. */
const MAX_HEX_BYTES = 2 * 1024 * 1024;

const HEX_RE = /^[0-9a-fA-F]*$/;

export function strip0x(value: string): string {
  return value.startsWith("0x") || value.startsWith("0X") ? value.slice(2) : value;
}

export function hexBytes(value: string): Uint8Array {
  const s = strip0x(value);
  if (s.length % 2 !== 0) throw new Error("invalid hex");
  if (s.length / 2 > MAX_HEX_BYTES) throw new Error("hex payload too large");
  if (!HEX_RE.test(s)) throw new Error("invalid hex");
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(s.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function hexEncode(bytes: Uint8Array): string {
  let s = "0x";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

export function addressBytes(value: string): Uint8Array {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) throw new Error("invalid address");
  const raw = hexBytes(value);
  if (raw.length !== 20) throw new Error("invalid address");
  return raw;
}

export function u64Be(n: bigint): Uint8Array {
  if (n < 0n || n > 0xffffffffffffffffn) throw new Error("value out of u64 range");
  const out = new Uint8Array(8);
  let v = n;
  for (let i = 7; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}
