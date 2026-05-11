import { describe, expect, it } from "vitest";
import { Nox, MAINNET_DEPLOYMENT } from "../src/index.js";

describe("Nox.mainnet", () => {
  const nox = Nox.mainnet();

  it("pins the mainnet deployment", () => {
    expect(nox.chainId).toBe(1);
    expect(nox.deployment.stakingProxy).toBe(MAINNET_DEPLOYMENT.stakingProxy);
  });

  it("namespace surface", () => {
    expect(nox.namespace.normalize("Operator.Alice")).toBe("operator.alice");
    expect(nox.namespace.type("operator.alice")).toBe("operator");
    expect(nox.namespace.hash("operator.alice")).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("tier surface accepts wei and NOX", () => {
    expect(nox.tier.fromNox("100000")).toBe(4);
    expect(nox.tier.nameFromNox("1000000")).toBe("ZeroState");
    expect(nox.tier.fromWei(50_000n * 10n ** 18n)).toBe(3);
  });

  it("operator id derivation", () => {
    const id = nox.operator.id({ wallet: "0x1111111111111111111111111111111111111111", positionId: 0n });
    expect(id.onchain).toMatch(/^0x[0-9a-f]{64}$/);
    expect(id.offchain).toMatch(/^0x[0-9a-f]{64}$/);
    expect(id.onchain).not.toBe(id.offchain);
  });

  it("proof + verify round-trip", () => {
    const proof = nox.proof.build({
      wallet: "0x1111111111111111111111111111111111111111",
      positionId: 0n,
      amount: "1",
      lockUntil: 1_900_000_000n,
      issuedAt: 1_700_000_000n,
      boostBps: 1500,
      tier: 3,
    });
    expect(nox.proof.verify(proof.receipt, proof.digest).valid).toBe(true);
  });

  it("eligibility gates", () => {
    expect(nox.eligibility.gateNox("jonos-preview", "100")).toBe(true);
    expect(nox.eligibility.gateNox("capsule-tooling", "9999")).toBe(false);
    expect(nox.eligibility.gateNox("operator-waitlist", "100000")).toBe(true);
  });
});
