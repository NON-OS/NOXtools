import { encodeAddress, encodeUint256, packCall } from "../abi/index.js";
import { ERC20 } from "./selectors.js";

export function approve(spender: string, amount: bigint): string {
  return packCall(ERC20.approve, [encodeAddress(spender), encodeUint256(amount)]);
}

export function transfer(to: string, amount: bigint): string {
  return packCall(ERC20.transfer, [encodeAddress(to), encodeUint256(amount)]);
}

export function allowance(owner: string, spender: string): string {
  return packCall(ERC20.allowance, [encodeAddress(owner), encodeAddress(spender)]);
}
