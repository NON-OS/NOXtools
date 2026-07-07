import { encodeUint256, packCall } from "../abi/index.js";
import { STAKING } from "./selectors.js";

export function stake(amount: bigint): string {
  return packCall(STAKING.stake, [encodeUint256(amount)]);
}

export function stakeLocked(amount: bigint, lockPeriod: bigint): string {
  return packCall(STAKING.stakeLocked, [encodeUint256(amount), encodeUint256(lockPeriod)]);
}

export function unstake(amount: bigint): string {
  return packCall(STAKING.unstake, [encodeUint256(amount)]);
}

export function unstakePosition(positionId: bigint): string {
  return packCall(STAKING.unstakePosition, [encodeUint256(positionId)]);
}

export function earlyUnlock(positionId: bigint): string {
  return packCall(STAKING.earlyUnlock, [encodeUint256(positionId)]);
}

export function claimRewards(): string {
  return STAKING.claimRewards;
}

export function compoundRewards(positionId: bigint): string {
  return packCall(STAKING.compoundRewards, [encodeUint256(positionId)]);
}

export function bindZeroStatePass(positionId: bigint, tokenId: bigint): string {
  return packCall(STAKING.bindZeroStatePass, [encodeUint256(positionId), encodeUint256(tokenId)]);
}

export function unbindZeroStatePass(positionId: bigint): string {
  return packCall(STAKING.unbindZeroStatePass, [encodeUint256(positionId)]);
}
