import { MAINNET_DEPLOYMENT, type Deployment } from "../deployment/index.js";
import { NoxLive } from "../live/index.js";
import type { RpcOptions } from "../rpc/index.js";
import { CalldataSurface } from "./surfaces/calldata.js";
import { EligibilitySurface } from "./surfaces/eligibility.js";
import { NamespaceSurface } from "./surfaces/namespace.js";
import { OperatorSurface } from "./surfaces/operator.js";
import { ProofSurface } from "./surfaces/proof.js";
import { ReceiptSurface } from "./surfaces/receipt.js";
import { SafeSurface } from "./surfaces/safe.js";
import { TierSurface } from "./surfaces/tier.js";
import type { NoxOptions } from "./types.js";

export class Nox {
  readonly deployment: Deployment;
  readonly chainId: number;
  readonly namespace = new NamespaceSurface();
  readonly tier = new TierSurface();
  readonly operator: OperatorSurface;
  readonly receipt: ReceiptSurface;
  readonly proof: ProofSurface;
  readonly eligibility = new EligibilitySurface();
  readonly safe = new SafeSurface();
  readonly calldata = new CalldataSurface();

  constructor(opts: NoxOptions = {}) {
    this.deployment = opts.deployment ?? MAINNET_DEPLOYMENT;
    this.chainId = opts.chainId ?? this.deployment.chainId;
    this.operator = new OperatorSurface(this.chainId, this.deployment);
    this.receipt = new ReceiptSurface(this.chainId, this.deployment);
    this.proof = new ProofSurface(this.chainId, this.deployment);
  }

  static mainnet(): Nox { return new Nox({ deployment: MAINNET_DEPLOYMENT }); }
  connect(rpcUrl: string, rpcOptions: RpcOptions = {}): NoxLive {
    return new NoxLive(rpcUrl, this.deployment, this.chainId, rpcOptions);
  }
}
