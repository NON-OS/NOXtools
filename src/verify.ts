import { offchainOperatorId, onchainOperatorId } from "./operator.js";
import { makeReceipt, receiptDigest } from "./receipt.js";
import type { StakeReceipt } from "./types.js";

export interface VerifyResult {
  valid: boolean;
  checks: { onchainOperatorId: boolean; offchainOperatorId: boolean; digest: boolean };
  recomputed: { onchainOperatorId: string; offchainOperatorId: string; digest: string };
}

export function verifyReceipt(receipt: StakeReceipt, claimedDigest?: string): VerifyResult {
  const fresh = makeReceipt(receipt);
  const digest = receiptDigest(fresh);
  const onchain = onchainOperatorId(receipt);
  const offchain = offchainOperatorId(receipt);
  const checks = {
    onchainOperatorId: onchain === receipt.onchainOperatorId,
    offchainOperatorId: offchain === receipt.offchainOperatorId,
    digest: claimedDigest === undefined || claimedDigest === digest,
  };
  return {
    valid: checks.onchainOperatorId && checks.offchainOperatorId && checks.digest,
    checks,
    recomputed: { onchainOperatorId: onchain, offchainOperatorId: offchain, digest },
  };
}
