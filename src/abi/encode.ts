import { bytesToHex, rawBytes } from "./hex.js";

const UINT256_MAX = (1n << 256n) - 1n;

export function encodeAddress(addr: string): string {
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) throw new Error("invalid address");
  const raw = rawBytes(addr);
  if (raw.length !== 20) throw new Error("invalid address");
  const out = new Uint8Array(32);
  out.set(raw, 12);
  return bytesToHex(out);
}

export function encodeUint256(value: bigint): string {
  if (typeof value !== "bigint") throw new Error("uint256 must be a bigint");
  if (value < 0n) throw new Error("uint256 cannot be negative");
  if (value > UINT256_MAX) throw new Error("uint256 overflow");
  const out = new Uint8Array(32);
  let v = value;
  for (let i = 31; i >= 0; i--) { out[i] = Number(v & 0xffn); v >>= 8n; }
  return bytesToHex(out);
}

export function encodeBytes32(hex: string): string {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) throw new Error("expected bytes32");
  const raw = rawBytes(hex);
  if (raw.length !== 32) throw new Error("expected bytes32");
  return bytesToHex(raw);
}

export function packCall(selector: string, words: string[]): string {
  const sel = selector.startsWith("0x") ? selector : `0x${selector}`;
  if (!/^0x[0-9a-fA-F]{8}$/.test(sel)) throw new Error("invalid selector");
  let tail = "";
  for (const w of words) {
    const word = w.startsWith("0x") ? w.slice(2) : w;
    if (!/^[0-9a-fA-F]{64}$/.test(word)) throw new Error("invalid abi word");
    tail += word;
  }
  const out = sel + tail;
  if (out.length !== 10 + words.length * 64) throw new Error("calldata length mismatch");
  return out;
}
