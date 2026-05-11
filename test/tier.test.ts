import { describe, expect, it } from "vitest";
import { tierFor, tierName } from "../src/tier.js";

describe("tier", () => {
  it("names cover all tiers", () => {
    expect(tierName(0)).toBe("Void");
    expect(tierName(1)).toBe("Signal");
    expect(tierName(2)).toBe("Circuit");
    expect(tierName(3)).toBe("Capsule");
    expect(tierName(4)).toBe("Operator");
    expect(tierName(5)).toBe("ZeroState");
    expect(tierName(99)).toBe("Void");
  });

  it("thresholds assign correctly", () => {
    expect(tierFor(0n)).toBe(0);
    expect(tierFor(100_000_000_000_000_000_000n)).toBe(1);
    expect(tierFor(1_000_000_000_000_000_000_000n)).toBe(2);
    expect(tierFor(10_000_000_000_000_000_000_000n)).toBe(3);
    expect(tierFor(100_000_000_000_000_000_000_000n)).toBe(4);
    expect(tierFor(1_000_000_000_000_000_000_000_000n)).toBe(5);
  });

  it("keeps just-below-threshold values in the lower tier", () => {
    expect(tierFor(99_999_999_999_999_999_999n)).toBe(0);
    expect(tierFor(999_999_999_999_999_999_999n)).toBe(1);
    expect(tierFor(9_999_999_999_999_999_999_999n)).toBe(2);
    expect(tierFor(99_999_999_999_999_999_999_999n)).toBe(3);
    expect(tierFor(999_999_999_999_999_999_999_999n)).toBe(4);
  });
});
