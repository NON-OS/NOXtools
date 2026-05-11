import type { Deployment } from "../deployment/index.js";

export type GateName = "jonos-preview" | "capsule-tooling" | "operator-waitlist";

export interface NoxOptions {
  deployment?: Deployment;
  chainId?: number;
}

export interface OperatorIdInput {
  wallet: string;
  positionId: bigint;
}

export interface ReceiptInput {
  wallet: string;
  positionId: bigint;
  amount: string | bigint | number;
  lockUntil: bigint | number | Date;
  issuedAt: bigint | number | Date;
  boostBps?: number;
  tier?: number;
  stakingContract?: string;
}
