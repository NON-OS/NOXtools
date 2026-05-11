import * as core from "../core/index.js";
import { CAPSULE_TOOLING, JONOS_PREVIEW, OPERATOR_WAITLIST, type GatePreset } from "../core/gate.js";
import { MAINNET_DEPLOYMENT, type Deployment } from "../deployment/index.js";
import { NoxLive } from "../live/index.js";
import type { PositionInput, StakeReceipt } from "../core/types.js";
import { toAmountString, toBigint, toWei } from "./convert.js";
import type { GateName, NoxOptions, OperatorIdInput, ReceiptInput } from "./types.js";

const GATES: Record<GateName, GatePreset> = {
  "jonos-preview": JONOS_PREVIEW,
  "capsule-tooling": CAPSULE_TOOLING,
  "operator-waitlist": OPERATOR_WAITLIST,
};

export class Nox {
  readonly deployment: Deployment;
  readonly chainId: number;

  constructor(opts: NoxOptions = {}) {
    this.deployment = opts.deployment ?? MAINNET_DEPLOYMENT;
    this.chainId = opts.chainId ?? this.deployment.chainId;
  }

  static mainnet(): Nox {
    return new Nox({ deployment: MAINNET_DEPLOYMENT });
  }

  connect(rpcUrl: string): NoxLive {
    return new NoxLive(rpcUrl, this.deployment, this.chainId);
  }

  namespace = {
    hash:      (name: string) => core.namespaceHash(name),
    normalize: (name: string) => core.normalizeNamespace(name),
    type:      (name: string) => core.namespaceType(name),
  };

  tier = {
    fromWei:     (score: bigint) => core.tierFor(score),
    fromNox:     (n: string | number | bigint) => core.tierFor(toWei(n)),
    name:        (t: number) => core.tierName(t),
    nameFromWei: (score: bigint) => core.tierName(core.tierFor(score)),
    nameFromNox: (n: string | number | bigint) => core.tierName(core.tierFor(toWei(n))),
  };

  operator = {
    id:         (i: OperatorIdInput) => ({ onchain: core.onchainOperatorId(this.#opPos(i)), offchain: core.offchainOperatorId(this.#opPos(i)) }),
    onchainId:  (i: OperatorIdInput) => core.onchainOperatorId(this.#opPos(i)),
    offchainId: (i: OperatorIdInput) => core.offchainOperatorId(this.#opPos(i)),
  };

  receipt = {
    build:  (i: ReceiptInput) => core.makeReceipt(this.#receiptPos(i)),
    digest: (r: StakeReceipt) => core.receiptDigest(r),
  };

  proof = {
    build:  (i: ReceiptInput, ns?: string) => core.buildProof(this.#receiptPos(i), ns),
    verify: (r: StakeReceipt, claimed?: string) => core.verifyReceipt(r, claimed),
  };

  eligibility = {
    tier:    (score: bigint) => core.tierFor(score),
    nox:     (n: string | number | bigint) => core.tierFor(toWei(n)),
    gate:    (name: GateName, score: bigint) => core.eligible(score, GATES[name]),
    gateNox: (name: GateName, n: string | number | bigint) => core.eligible(toWei(n), GATES[name]),
    gates:   () => GATES,
  };

  safe = {
    tx: (to: string, data: string) => core.safeTx(to, data),
  };

  #opPos(i: OperatorIdInput): PositionInput {
    return { wallet: i.wallet, chainId: this.chainId, stakingContract: this.deployment.stakingProxy, positionId: i.positionId, amount: "0", lockUntil: 0n, boostBps: 0, tier: 0, issuedAt: 0n };
  }

  #receiptPos(i: ReceiptInput): PositionInput {
    return {
      wallet: i.wallet,
      chainId: this.chainId,
      stakingContract: i.stakingContract ?? this.deployment.stakingProxy,
      positionId: i.positionId,
      amount: toAmountString(i.amount),
      lockUntil: toBigint(i.lockUntil),
      boostBps: i.boostBps ?? 0,
      tier: i.tier ?? 0,
      issuedAt: toBigint(i.issuedAt),
    };
  }
}
