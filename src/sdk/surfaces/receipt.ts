import { makeReceipt, receiptDigest } from "../../core/receipt.js";
import type { StakeReceipt } from "../../core/types.js";
import type { Deployment } from "../../deployment/index.js";
import { receiptPosition } from "../positions.js";
import type { ReceiptInput } from "../types.js";

export class ReceiptSurface {
  constructor(private chainId: number, private deployment: Deployment) {}
  build(i: ReceiptInput): StakeReceipt { return makeReceipt(receiptPosition(this.chainId, this.deployment, i)); }
  digest(r: StakeReceipt): string { return receiptDigest(r); }
}
