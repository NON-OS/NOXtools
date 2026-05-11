import { hexBytes } from "../core/hex.js";

export function bytesToHex(b: Uint8Array): string {
  let s = "0x";
  for (const x of b) s += x.toString(16).padStart(2, "0");
  return s;
}

export function rawBytes(value: string): Uint8Array {
  return hexBytes(value);
}
