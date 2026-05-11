import { rawBytes } from "./hex.js";

function uintAt(raw: Uint8Array, off: number): bigint {
  let v = 0n;
  for (let i = 0; i < 32; i++) v = (v << 8n) | BigInt(raw[off + i] ?? 0);
  return v;
}

export function decodeUint256(hex: string): bigint {
  const raw = rawBytes(hex);
  if (raw.length < 32) throw new Error("invalid uint256");
  return uintAt(raw, 0);
}

export function decodeBool(hex: string): boolean {
  return decodeUint256(hex) !== 0n;
}

export function decodeAddress(hex: string): string {
  const raw = rawBytes(hex);
  if (raw.length < 32) throw new Error("invalid address word");
  let out = "0x";
  for (const b of raw.subarray(12, 32)) out += b.toString(16).padStart(2, "0");
  return out;
}

export function decodeString(hex: string): string {
  const raw = rawBytes(hex);
  if (raw.length < 64) throw new Error("invalid string return");
  const offset = Number(uintAt(raw, 0));
  const len = Number(uintAt(raw, offset));
  return new TextDecoder().decode(raw.subarray(offset + 32, offset + 32 + len));
}

export function decodeWords(hex: string): bigint[] {
  const raw = rawBytes(hex);
  if (raw.length % 32 !== 0) throw new Error("not word-aligned");
  const out: bigint[] = [];
  for (let i = 0; i < raw.length; i += 32) out.push(uintAt(raw, i));
  return out;
}
