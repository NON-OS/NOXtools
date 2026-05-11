import type { SafeTx } from "./types.js";

export function safeTx(to: string, data: string): SafeTx {
  return { to, value: "0", data, operation: 0 };
}
