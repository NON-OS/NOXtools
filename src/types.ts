export interface PositionInput {
  wallet: string;
  chainId: number;
  stakingContract: string;
  positionId: bigint;
  amount: string;
  lockUntil: bigint;
  boostBps: number;
  tier: number;
  issuedAt: bigint;
}

export interface StakeReceipt extends PositionInput {
  onchainOperatorId: string;
  offchainOperatorId: string;
}

export interface SafeTx {
  to: string;
  value: string;
  data: string;
  operation: 0 | 1;
}
