import { safeTx } from "../../core/safe.js";
import type { SafeTx } from "../../core/types.js";

export class SafeSurface {
  tx(to: string, data: string): SafeTx { return safeTx(to, data); }
}
