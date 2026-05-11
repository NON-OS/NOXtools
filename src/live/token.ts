import { decodeUint256, encodeAddress, packCall } from "../abi/index.js";
import type { Deployment } from "../deployment/index.js";
import { SELECTORS } from "./selectors.js";
import type { Caller } from "./types.js";

export function tokenSurface(deployment: Deployment, call: Caller) {
  const to = deployment.token;
  return {
    balanceOf: async (wallet: string) =>
      decodeUint256(await call(to, packCall(SELECTORS.balanceOf, [encodeAddress(wallet)]))),
  };
}
