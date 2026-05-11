import { namespaceHash, namespaceType, type NamespaceType } from "./namespace.js";
import { makeReceipt, receiptDigest } from "./receipt.js";
import { tierName, type TierName } from "./tier.js";
import type { PositionInput, StakeReceipt } from "./types.js";

export interface ProofBundle {
  receipt: StakeReceipt;
  digest: string;
  onchainOperatorId: string;
  offchainOperatorId: string;
  tier: number;
  tierName: TierName;
  issuedAt: bigint;
  namespace?: { name: string; hash: string; type: NamespaceType };
  namespaceHash?: string;
}

export function buildProof(input: PositionInput, namespace?: string): ProofBundle {
  const receipt = makeReceipt(input);
  const digest = receiptDigest(receipt);
  const ns = namespace ? { name: namespace, hash: namespaceHash(namespace), type: namespaceType(namespace) } : undefined;
  const out: ProofBundle = {
    receipt,
    digest,
    onchainOperatorId: receipt.onchainOperatorId,
    offchainOperatorId: receipt.offchainOperatorId,
    tier: receipt.tier,
    tierName: tierName(receipt.tier),
    issuedAt: receipt.issuedAt,
  };
  if (ns) {
    out.namespace = ns;
    out.namespaceHash = ns.hash;
  }
  return out;
}
