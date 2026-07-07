import { keccak_256 } from "@noble/hashes/sha3.js";
import { hexEncode } from "./hex.js";
import { offchainOperatorId, onchainOperatorId } from "./operator.js";
import type { PositionInput, StakeReceipt } from "./types.js";

export function makeReceipt(input: PositionInput): StakeReceipt {
  return {
    ...input,
    onchainOperatorId: onchainOperatorId(input),
    offchainOperatorId: offchainOperatorId(input),
  };
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const ID_RE = /^0x[0-9a-f]{64}$/;
const AMOUNT_RE = /^\d+(\.\d+)?$/;

// Field domains from crates/nox-core/src/types.rs (PositionInput/StakeReceipt).
const U64_MAX = (1n << 64n) - 1n; // chain_id / position_id / lock_until / issued_at: u64
const U32_MAX = 0xffffffff; // boost_bps: u32
const U8_MAX = 0xff; // tier: u8

export function receiptDigest(r: StakeReceipt): string {
  // The digest preimage joins fields with "|"; free-form strings would let two
  // different receipts collide. Reject anything that is not strictly shaped.
  if (!ADDRESS_RE.test(r.wallet)) throw new Error("receipt: invalid wallet address");
  if (!ADDRESS_RE.test(r.stakingContract)) throw new Error("receipt: invalid staking contract address");
  if (!AMOUNT_RE.test(r.amount)) throw new Error("receipt: invalid amount string");
  if (!ID_RE.test(r.onchainOperatorId)) throw new Error("receipt: invalid onchain operator id");
  if (!ID_RE.test(r.offchainOperatorId)) throw new Error("receipt: invalid offchain operator id");
  if (!Number.isInteger(r.chainId) || r.chainId < 0 || r.chainId > Number(U64_MAX)) {
    throw new Error("receipt: invalid chainId");
  }
  if (!Number.isInteger(r.boostBps) || r.boostBps < 0 || r.boostBps > U32_MAX) {
    throw new Error("receipt: invalid boostBps");
  }
  if (!Number.isInteger(r.tier) || r.tier < 0 || r.tier > U8_MAX) throw new Error("receipt: invalid tier");
  if (typeof r.positionId !== "bigint" || r.positionId < 0n || r.positionId > U64_MAX) {
    throw new Error("receipt: invalid positionId");
  }
  if (typeof r.lockUntil !== "bigint" || r.lockUntil < 0n || r.lockUntil > U64_MAX) {
    throw new Error("receipt: invalid lockUntil");
  }
  if (typeof r.issuedAt !== "bigint" || r.issuedAt < 0n || r.issuedAt > U64_MAX) {
    throw new Error("receipt: invalid issuedAt");
  }
  const body = [
    "NOX_STAKE_RECEIPT_V1",
    r.wallet,
    r.chainId,
    r.stakingContract,
    r.positionId.toString(),
    r.amount,
    r.lockUntil.toString(),
    r.boostBps,
    r.tier,
    r.issuedAt.toString(),
    r.onchainOperatorId,
    r.offchainOperatorId,
  ].join("|");
  return hexEncode(keccak_256(new TextEncoder().encode(body)));
}

export function verifyReceiptShape(value: unknown): value is StakeReceipt {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r["wallet"] === "string" &&
    typeof r["chainId"] === "number" &&
    typeof r["stakingContract"] === "string" &&
    typeof r["positionId"] === "bigint" &&
    typeof r["amount"] === "string" &&
    typeof r["lockUntil"] === "bigint" &&
    typeof r["boostBps"] === "number" &&
    typeof r["tier"] === "number" &&
    typeof r["issuedAt"] === "bigint" &&
    typeof r["onchainOperatorId"] === "string" &&
    typeof r["offchainOperatorId"] === "string"
  );
}
