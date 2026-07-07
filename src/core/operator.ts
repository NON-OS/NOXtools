import { keccak_256 } from "@noble/hashes/sha3.js";
import { blake3 } from "@noble/hashes/blake3.js";
import { addressBytes, hexEncode, u64Be } from "./hex.js";
import type { PositionInput } from "./types.js";

function preimage(label: string, p: PositionInput): Uint8Array {
  const labelBytes = new TextEncoder().encode(label);
  const chain = u64Be(BigInt(p.chainId));
  const staking = addressBytes(p.stakingContract);
  const wallet = addressBytes(p.wallet);
  const pos = u64Be(p.positionId);
  const out = new Uint8Array(labelBytes.length + chain.length + staking.length + wallet.length + pos.length);
  let off = 0;
  for (const part of [labelBytes, chain, staking, wallet, pos]) {
    out.set(part, off);
    off += part.length;
  }
  return out;
}

export function onchainOperatorId(p: PositionInput): string {
  // The canonical Rust encodes positionId with word_u64 (crates/nox-core/src/
  // operator.rs), i.e. it is a u64. Bound it here so TS matches the spec and
  // rejects impossible values; for every in-range id the 32-byte word (and thus
  // the digest) is byte-identical to the previous u256 encoding.
  if (p.positionId < 0n || p.positionId >= 1n << 64n) throw new Error("positionId out of u64 range");
  const label = new TextEncoder().encode("NOX_OPERATOR_V1");
  return hexEncode(
    keccak_256(
      concatWords([
        u256Word(96n),
        addressWord(addressBytes(p.wallet)),
        u256Word(p.positionId),
        u256Word(BigInt(label.length)),
        bytesWord(label),
      ]),
    ),
  );
}

export function offchainOperatorId(p: PositionInput): string {
  return hexEncode(blake3(preimage("NOX_OPERATOR_BLAKE3_V1", p)));
}

function concatWords(words: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(words.length * 32);
  words.forEach((w, i) => out.set(w, i * 32));
  return out;
}

function u256Word(value: bigint): Uint8Array {
  if (value < 0n || value >= 1n << 256n) throw new Error("value out of u256 range");
  const out = new Uint8Array(32);
  let v = value;
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

function addressWord(addr: Uint8Array): Uint8Array {
  const out = new Uint8Array(32);
  out.set(addr, 12);
  return out;
}

function bytesWord(bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(32);
  out.set(bytes);
  return out;
}
