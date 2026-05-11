import { tierFor, tierName, type TierName } from "../../core/tier.js";
import { toWei } from "../convert.js";

export class TierSurface {
  fromWei(score: bigint): number { return tierFor(score); }
  fromNox(n: string | number | bigint): number { return tierFor(toWei(n)); }
  name(t: number): TierName { return tierName(t); }
  nameFromWei(score: bigint): TierName { return tierName(tierFor(score)); }
  nameFromNox(n: string | number | bigint): TierName { return tierName(tierFor(toWei(n))); }
}
