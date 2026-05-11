import { describe, expect, it } from "vitest";
import { namespaceHash, normalizeNamespace } from "../src/core/namespace.js";

describe("namespace", () => {
  it("accepts allowed prefixes", () => {
    expect(normalizeNamespace("systems.nonos.foo")).toBe("systems.nonos.foo");
    expect(normalizeNamespace("operator.alice")).toBe("operator.alice");
    expect(normalizeNamespace("capsule.demo-1")).toBe("capsule.demo-1");
  });

  it("normalizes case and whitespace", () => {
    expect(normalizeNamespace("  Systems.NONOS.Foo  ")).toBe("systems.nonos.foo");
  });

  it("rejects invalid namespaces", () => {
    expect(() => normalizeNamespace("apps.unknown.x")).toThrow();
    expect(() => normalizeNamespace("operator.alice_bob")).toThrow();
    expect(() => normalizeNamespace("operator." + "a".repeat(96))).toThrow();
  });

  it("hash is deterministic and 0x-prefixed", () => {
    const a = namespaceHash("systems.nonos.kernel-lab");
    const b = namespaceHash("Systems.NONOS.kernel-lab");
    expect(a).toBe(b);
    expect(a).toMatch(/^0x[0-9a-f]{64}$/);
  });
});
