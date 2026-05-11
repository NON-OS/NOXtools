import { decodeAddress, decodeBool, encodeAddress, encodeBytes32, encodeUint256, packCall } from "../abi/index.js";
import { namespaceHash } from "../core/index.js";
import type { Deployment } from "../deployment/index.js";
import { SELECTORS } from "./selectors.js";
import type { Caller } from "./types.js";

export function namespaceSurface(deployment: Deployment, call: Caller) {
  const to = deployment.namespaceRegistry;
  return {
    ownerOf: async (name: string) =>
      decodeAddress(await call(to, packCall(SELECTORS.ownerOfNamespace, [encodeBytes32(namespaceHash(name))]))),
    canReserve: async (wallet: string, positionId: bigint, name: string) =>
      decodeBool(await call(to, packCall(SELECTORS.canReserve, [
        encodeAddress(wallet),
        encodeUint256(positionId),
        encodeBytes32(namespaceHash(name)),
      ]))),
  };
}
