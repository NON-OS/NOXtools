import type { Deployment } from "../deployment/index.js";
import { rpcCall, type RpcOptions } from "../rpc/index.js";
import { accessSurface } from "./access.js";
import { namespaceSurface } from "./namespace.js";
import { stakingSurface } from "./staking.js";
import { tokenSurface } from "./token.js";
import { txSurface } from "./tx.js";

export class NoxLive {
  readonly staking: ReturnType<typeof stakingSurface>;
  readonly namespace: ReturnType<typeof namespaceSurface>;
  readonly access: ReturnType<typeof accessSurface>;
  readonly token: ReturnType<typeof tokenSurface>;
  readonly tx: ReturnType<typeof txSurface>;

  constructor(
    readonly rpcUrl: string,
    readonly deployment: Deployment,
    readonly chainId: number,
    readonly rpcOptions: RpcOptions = {},
  ) {
    const call = (to: string, data: string) =>
      rpcCall(rpcUrl, "eth_call", [{ to, data }, "latest"], rpcOptions);
    this.staking = stakingSurface(deployment, call);
    this.namespace = namespaceSurface(deployment, call);
    this.access = accessSurface(deployment, call);
    this.token = tokenSurface(deployment, call);
    this.tx = txSurface(rpcUrl, rpcOptions);
  }
}
