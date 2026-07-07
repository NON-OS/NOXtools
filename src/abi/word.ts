import { bytesToHex } from "./hex.js";

/**
 * Decode a 32-byte ABI word as an `address`. A real chain always left-pads an
 * address with 12 zero bytes; any non-zero upper byte is malformed/hostile and
 * is rejected here. Shared by decode.ts, events.ts and revert.ts so the check
 * cannot drift apart between the three decoders.
 */
export function addressWord(word: Uint8Array): `0x${string}` {
  if (word.length !== 32) throw new Error("invalid address word");
  for (let i = 0; i < 12; i++) {
    if (word[i] !== 0) throw new Error("address word has dirty upper bytes");
  }
  return bytesToHex(word.subarray(12)) as `0x${string}`;
}
