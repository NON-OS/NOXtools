import { keccak_256 } from "@noble/hashes/sha3.js";
import { hexEncode } from "./hex.js";

const ALLOWED_PREFIXES = ["systems.nonos.", "operator.", "capsule."];

export function normalizeNamespace(value: string): string {
  const name = value.trim().toLowerCase();
  const hasPrefix = ALLOWED_PREFIXES.some((p) => name.startsWith(p));
  const validChars = /^[a-z0-9.\-]+$/.test(name);
  if (!hasPrefix || !validChars || name.length > 96) {
    throw new Error("invalid namespace");
  }
  return name;
}

export function namespaceHash(value: string): string {
  const name = normalizeNamespace(value);
  return hexEncode(keccak_256(new TextEncoder().encode(name)));
}

export type NamespaceType = "system" | "operator" | "capsule";

export function namespaceType(value: string): NamespaceType {
  const name = normalizeNamespace(value);
  if (name.startsWith("systems.nonos.")) return "system";
  if (name.startsWith("operator.")) return "operator";
  return "capsule";
}
