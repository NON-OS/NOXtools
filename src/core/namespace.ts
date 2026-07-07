import { keccak_256 } from "@noble/hashes/sha3.js";
import { hexEncode } from "./hex.js";

const ALLOWED_PREFIXES = ["systems.nonos.", "operator.", "capsule."];

/**
 * ASCII-only lowercasing, matching Rust's `str::to_ascii_lowercase`. Full
 * Unicode `.toLowerCase()` folds non-ASCII homoglyphs (e.g. U+212A KELVIN SIGN
 * -> "k") into the ASCII charset, letting distinct inputs collide onto the same
 * namespace. We only fold A-Z; every other code unit is left untouched so the
 * charset check below still sees (and rejects) any non-ASCII byte.
 */
function asciiLowercase(value: string): string {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    out += c >= 0x41 && c <= 0x5a ? String.fromCharCode(c + 0x20) : value[i];
  }
  return out;
}

export function normalizeNamespace(value: string): string {
  // Mirror crates/nox-core/src/namespace.rs exactly: trim, ASCII-lowercase,
  // then require an allowed prefix, an all-ASCII [a-z0-9.-] charset, and len<=96.
  const name = asciiLowercase(value.trim());
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
