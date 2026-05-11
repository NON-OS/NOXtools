import { offchainOperatorId, onchainOperatorId } from "../../core/operator.js";
import type { Deployment } from "../../deployment/index.js";
import { opPosition } from "../positions.js";
import type { OperatorIdInput } from "../types.js";

export class OperatorSurface {
  constructor(private chainId: number, private deployment: Deployment) {}
  id(i: OperatorIdInput) {
    const p = opPosition(this.chainId, this.deployment, i);
    return { onchain: onchainOperatorId(p), offchain: offchainOperatorId(p) };
  }
  onchainId(i: OperatorIdInput): string { return onchainOperatorId(opPosition(this.chainId, this.deployment, i)); }
  offchainId(i: OperatorIdInput): string { return offchainOperatorId(opPosition(this.chainId, this.deployment, i)); }
}
