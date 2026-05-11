import { describe, expect, it } from "vitest";
import { safeTx } from "../src/core/safe.js";

describe("safe", () => {
  it("builds a standard Safe payload", () => {
    const tx = safeTx("0x1111111111111111111111111111111111111111", "0xdeadbeef");
    expect(tx).toEqual({
      to: "0x1111111111111111111111111111111111111111",
      value: "0",
      data: "0xdeadbeef",
      operation: 0,
    });
  });
});
