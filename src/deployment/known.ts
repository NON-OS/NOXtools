import { MAINNET_DEPLOYMENT } from "./mainnet.js";
import type { Deployment } from "./types.js";

export function knownDeployment(chainId: number): Deployment | undefined {
  return chainId === 1 ? MAINNET_DEPLOYMENT : undefined;
}
