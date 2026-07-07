import { rawBytes } from "./hex.js";
import { addressWord } from "./word.js";

/** Max dynamic string length we will decode from untrusted return data. */
const MAX_STRING_BYTES = 8_192;
/** Max number of 32-byte words we will decode from untrusted return data. */
const MAX_WORDS = 4_096;

function uintAt(raw: Uint8Array, off: number): bigint {
  let v = 0n;
  for (let i = 0; i < 32; i++) v = (v << 8n) | BigInt(raw[off + i] ?? 0);
  return v;
}

export function decodeUint256(hex: string): bigint {
  const raw = rawBytes(hex);
  if (raw.length !== 32) throw new Error("invalid uint256");
  return uintAt(raw, 0);
}

export function decodeBool(hex: string): boolean {
  return decodeUint256(hex) !== 0n;
}

export function decodeAddress(hex: string): string {
  return addressWord(rawBytes(hex));
}

export function decodeString(hex: string): string {
  const raw = rawBytes(hex);
  if (raw.length < 64) throw new Error("invalid string return");
  if (raw.length % 32 !== 0) throw new Error("string return is not word aligned");
  const offsetWord = uintAt(raw, 0);
  if (offsetWord % 32n !== 0n || offsetWord > BigInt(raw.length - 32)) {
    throw new Error("string offset out of bounds");
  }
  const offset = Number(offsetWord);
  const lenWord = uintAt(raw, offset);
  if (lenWord > BigInt(MAX_STRING_BYTES)) throw new Error("string too long");
  const len = Number(lenWord);
  if (offset + 32 + len > raw.length) throw new Error("string length out of bounds");
  return new TextDecoder().decode(raw.subarray(offset + 32, offset + 32 + len));
}

export function decodeWords(hex: string): bigint[] {
  const raw = rawBytes(hex);
  if (raw.length % 32 !== 0) throw new Error("not word-aligned");
  if (raw.length / 32 > MAX_WORDS) throw new Error("too many words");
  const out: bigint[] = [];
  for (let i = 0; i < raw.length; i += 32) out.push(uintAt(raw, i));
  return out;
}
