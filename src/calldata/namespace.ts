import { encodeBytes32, encodeUint256, packCall } from "../abi/index.js";
import { namespaceHash } from "../core/namespace.js";
import { NAMESPACE } from "./selectors.js";

export function reserve(name: string, positionId: bigint): string {
  return packCall(NAMESPACE.reserve, [encodeBytes32(namespaceHash(name)), encodeUint256(positionId)]);
}

export function release(name: string): string {
  return packCall(NAMESPACE.release, [encodeBytes32(namespaceHash(name))]);
}
