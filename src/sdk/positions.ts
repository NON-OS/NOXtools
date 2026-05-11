import type { PositionInput } from "../core/types.js";
import type { Deployment } from "../deployment/index.js";
import { toAmountString, toBigint } from "./convert.js";
import type { OperatorIdInput, ReceiptInput } from "./types.js";

export function opPosition(chainId: number, deployment: Deployment, i: OperatorIdInput): PositionInput {
  return {
    wallet: i.wallet,
    chainId,
    stakingContract: deployment.stakingProxy,
    positionId: i.positionId,
    amount: "0",
    lockUntil: 0n,
    boostBps: 0,
    tier: 0,
    issuedAt: 0n,
  };
}

export function receiptPosition(chainId: number, deployment: Deployment, i: ReceiptInput): PositionInput {
  return {
    wallet: i.wallet,
    chainId,
    stakingContract: i.stakingContract ?? deployment.stakingProxy,
    positionId: i.positionId,
    amount: toAmountString(i.amount),
    lockUntil: toBigint(i.lockUntil),
    boostBps: i.boostBps ?? 0,
    tier: i.tier ?? 0,
    issuedAt: toBigint(i.issuedAt),
  };
}
