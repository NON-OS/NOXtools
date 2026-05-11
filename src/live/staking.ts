import { decodeString, decodeUint256, decodeWords, encodeAddress, packCall } from "../abi/index.js";
import type { Deployment } from "../deployment/index.js";
import { SELECTORS } from "./selectors.js";
import type { Caller, StakingHealth, StakingStats } from "./types.js";

export function stakingSurface(deployment: Deployment, call: Caller) {
  const to = deployment.stakingProxy;
  const callAddr = (sel: string, addr: string) => call(to, packCall(sel, [encodeAddress(addr)]));
  return {
    version:             async () => decodeString(await call(to, SELECTORS.stakingVersion)),
    rewardReserve:       async () => decodeUint256(await call(to, SELECTORS.rewardReserve)),
    rewardRunway:        async () => decodeUint256(await call(to, SELECTORS.rewardRunway)),
    stats:               async (): Promise<StakingStats> => statsFromWords(decodeWords(await call(to, SELECTORS.protocolStakingStats))),
    health:              async (): Promise<StakingHealth> => healthFromWords(decodeWords(await call(to, SELECTORS.stakingHealth))),
    pendingRewards:      async (wallet: string) => decodeUint256(await callAddr(SELECTORS.pendingRewards, wallet)),
    activePositionCount: async (wallet: string) => decodeUint256(await callAddr(SELECTORS.activePositionCount, wallet)),
  };
}

function statsFromWords(w: bigint[]): StakingStats {
  return { totalStaked: w[0]!, totalWeightedStake: w[1]!, rewardReserve: w[2]!, rewardsDistributed: w[3]!, penaltiesBurned: w[4]!, emissionRate: w[5]!, accRewardPerShare: w[6]! };
}

function healthFromWords(w: bigint[]): StakingHealth {
  return { rewardReserve: w[0]!, rewardRunway: w[1]!, totalStaked: w[2]!, emissionRate: w[3]!, paused: w[4]! !== 0n };
}
