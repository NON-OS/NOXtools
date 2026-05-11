import { keccak_256 } from "@noble/hashes/sha3";
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

export function receiptDigest(r: StakeReceipt): string {
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
