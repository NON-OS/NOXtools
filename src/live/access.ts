import { decodeBool, decodeUint256, encodeAddress, encodeUint256, packCall } from "../abi/index.js";
import type { Deployment } from "../deployment/index.js";
import { SELECTORS } from "./selectors.js";
import type { Caller } from "./types.js";

export function accessSurface(deployment: Deployment, call: Caller) {
  const to = deployment.accessRegistry;
  return {
    has:  async (wallet: string, flag: number) =>
      decodeBool(await call(to, packCall(SELECTORS.hasAccess, [encodeAddress(wallet), encodeUint256(BigInt(flag))]))),
    mask: async (wallet: string) =>
      decodeUint256(await call(to, packCall(SELECTORS.accessMask, [encodeAddress(wallet)]))),
  };
}
