import { buildProof, type ProofBundle } from "./proof.js";
import type { PositionInput } from "./types.js";

export interface OperatorProfile {
  wallet: string;
  chainId: number;
  stakingContract: string;
  positionId: bigint;
  tier: number;
  tierName: ProofBundle["tierName"];
  onchainOperatorId: string;
  offchainOperatorId: string;
  issuedAt: bigint;
  digest: string;
  namespace?: ProofBundle["namespace"];
}

export function buildProfile(input: PositionInput, namespace?: string): OperatorProfile {
  const proof = buildProof(input, namespace);
  const out: OperatorProfile = {
    wallet: proof.receipt.wallet,
    chainId: proof.receipt.chainId,
    stakingContract: proof.receipt.stakingContract,
    positionId: proof.receipt.positionId,
    tier: proof.tier,
    tierName: proof.tierName,
    onchainOperatorId: proof.onchainOperatorId,
    offchainOperatorId: proof.offchainOperatorId,
    issuedAt: proof.issuedAt,
    digest: proof.digest,
  };
  if (proof.namespace) out.namespace = proof.namespace;
  return out;
}
