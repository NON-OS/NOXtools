import { describe, expect, it } from "vitest";
import { knownDeployment, MAINNET_DEPLOYMENT } from "../src/deployment/index.js";

describe("deployment constants", () => {
  it("pins the live V4 mainnet deployment", () => {
    expect(MAINNET_DEPLOYMENT.chainId).toBe(1);
    expect(MAINNET_DEPLOYMENT.stakingProxy).toBe("0xa94d6009790Ba13597A1E1b7cF4e1531eA513613");
    expect(MAINNET_DEPLOYMENT.stakingImpl).toBe("0x415790B1f0aecd18B24D53BEaa25597573375B63");
    expect(MAINNET_DEPLOYMENT.namespaceRegistry).toBe("0xD554ae30A0D20CB988c40d6C3b3d907740B9FD5C");
    expect(MAINNET_DEPLOYMENT.accessRegistry).toBe("0x31140F839E2BB03C903ca894A87DF40c7333d38b");
  });

  it("returns undefined for unknown chains", () => {
    expect(knownDeployment(1)).toBe(MAINNET_DEPLOYMENT);
    expect(knownDeployment(11155111)).toBeUndefined();
  });
});
