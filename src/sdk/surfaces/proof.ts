import { buildProof, type ProofBundle } from "../../core/proof.js";
import type { StakeReceipt } from "../../core/types.js";
import { verifyReceipt, type VerifyResult } from "../../core/verify.js";
import type { Deployment } from "../../deployment/index.js";
import { receiptPosition } from "../positions.js";
import type { ReceiptInput } from "../types.js";

export class ProofSurface {
  constructor(private chainId: number, private deployment: Deployment) {}
  build(i: ReceiptInput, ns?: string): ProofBundle { return buildProof(receiptPosition(this.chainId, this.deployment, i), ns); }
  verify(r: StakeReceipt, claimed?: string): VerifyResult { return verifyReceipt(r, claimed); }
}
