import { keccak_256 } from "@noble/hashes/sha3";
import { blake3 } from "@noble/hashes/blake3";
import { addressBytes, hexEncode, u64Be } from "./hex.js";
import type { PositionInput } from "./types.js";

function preimage(label: string, p: PositionInput): Uint8Array {
  if (p.positionId === 0n) throw new Error("invalid position");
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
  return hexEncode(keccak_256(preimage("NOX_OPERATOR_V1", p)));
}

export function offchainOperatorId(p: PositionInput): string {
  return hexEncode(blake3(preimage("NOX_OPERATOR_BLAKE3_V1", p)));
}
