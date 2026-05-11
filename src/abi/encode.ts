import { bytesToHex, rawBytes } from "./hex.js";

export function encodeAddress(addr: string): string {
  const raw = rawBytes(addr);
  if (raw.length !== 20) throw new Error("invalid address");
  const out = new Uint8Array(32);
  out.set(raw, 12);
  return bytesToHex(out);
}

export function encodeUint256(value: bigint): string {
  const out = new Uint8Array(32);
  let v = value;
  for (let i = 31; i >= 0; i--) { out[i] = Number(v & 0xffn); v >>= 8n; }
  return bytesToHex(out);
}

export function encodeBytes32(hex: string): string {
  const raw = rawBytes(hex);
  if (raw.length !== 32) throw new Error("expected bytes32");
  return bytesToHex(raw);
}

export function packCall(selector: string, words: string[]): string {
  const sel = selector.startsWith("0x") ? selector : `0x${selector}`;
  const tail = words.map((w) => (w.startsWith("0x") ? w.slice(2) : w)).join("");
  return sel + tail;
}
