import { describe, expect, it } from "vitest";
import { getAddress } from "ethers";
import { knownDeployment, MAINNET_DEPLOYMENT } from "../src/deployment/index.js";

describe("deployment constants", () => {
  it("pins the live V4 mainnet deployment", () => {
    expect(MAINNET_DEPLOYMENT.chainId).toBe(1);
    expect(MAINNET_DEPLOYMENT.stakingProxy).toBe("0xa94d6009790Ba13597A1E1b7cF4e1531eA513613");
    expect(MAINNET_DEPLOYMENT.stakingImpl).toBe("0x415790B1f0aecd18B24D53BEaa25597573375B63");
    expect(MAINNET_DEPLOYMENT.namespaceRegistry).toBe("0xD554ae30A0D20CB988c40d6C3b3d907740B9FD5C");
    expect(MAINNET_DEPLOYMENT.accessRegistry).toBe("0x31140F839E2BB03C903ca894A87DF40c7333d38b");
    expect(MAINNET_DEPLOYMENT.safe).toBe("0x3a52ea60F61036Afbbec25F46a64485Ac4477Ccc");
  });

  it("uses strict checksummed addresses accepted by wallet tooling", () => {
    const addresses = [
      MAINNET_DEPLOYMENT.stakingProxy,
      MAINNET_DEPLOYMENT.stakingImpl,
      MAINNET_DEPLOYMENT.namespaceRegistry,
      MAINNET_DEPLOYMENT.accessRegistry,
      MAINNET_DEPLOYMENT.safe,
    ];
    for (const address of addresses) {
      // getAddress returns the EIP-55 checksummed form and throws on a bad
      // mixed-case checksum; equality proves the pinned address is strict.
      expect(getAddress(address), address).toBe(address);
    }
  });

  it("returns undefined for unknown chains", () => {
    expect(knownDeployment(1)).toBe(MAINNET_DEPLOYMENT);
    expect(knownDeployment(11155111)).toBeUndefined();
  });
});
