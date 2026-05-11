export function strip0x(value: string): string {
  return value.startsWith("0x") ? value.slice(2) : value;
}

export function hexBytes(value: string): Uint8Array {
  const s = strip0x(value);
  if (s.length % 2 !== 0) throw new Error("invalid hex");
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = Number.parseInt(s.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) throw new Error("invalid hex");
    out[i] = byte;
  }
  return out;
}

export function hexEncode(bytes: Uint8Array): string {
  let s = "0x";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

export function addressBytes(value: string): Uint8Array {
  const raw = hexBytes(value);
  if (raw.length !== 20) throw new Error("invalid address");
  return raw;
}

export function u64Be(n: bigint): Uint8Array {
  const out = new Uint8Array(8);
  let v = n;
  for (let i = 7; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}
