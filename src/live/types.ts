export interface StakingStats {
  totalStaked: bigint;
  totalWeightedStake: bigint;
  rewardReserve: bigint;
  rewardsDistributed: bigint;
  penaltiesBurned: bigint;
  emissionRate: bigint;
  accRewardPerShare: bigint;
}

export interface StakingHealth {
  rewardReserve: bigint;
  rewardRunway: bigint;
  totalStaked: bigint;
  emissionRate: bigint;
  paused: boolean;
}

export type Caller = (to: string, data: string) => Promise<string>;
