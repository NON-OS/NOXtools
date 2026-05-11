# @nonos/nox-staking-sdk

TypeScript SDK for the NOX Operator Kit. One entry point, two modes.

```ts
import { Nox } from "@nonos/nox-staking-sdk";

const nox  = Nox.mainnet();        // pure: hashes, IDs, receipts, eligibility — no network
const live = nox.connect(rpcUrl);  // optional: typed reads of the live mainnet contracts
```

NOX staking grants ecosystem rights. It does not grant kernel capabilities. Runtime authority flows through `CapsuleManifest`, not this SDK.

## Install

```bash
npm  install @nonos/nox-staking-sdk
pnpm add     @nonos/nox-staking-sdk
yarn add     @nonos/nox-staking-sdk
bun  add     @nonos/nox-staking-sdk
```

Node 20+. ESM only. Browser-safe (only crypto dep is `@noble/hashes`).

## Concepts

- **Operator ID** — deterministic identifier for a `(wallet, positionId)` pair. The on-chain variant matches `NOXStakingV4.operatorId(wallet, positionId)` exactly. The off-chain variant adds chainId + staking contract for off-chain namespacing.
- **Namespace** — string under `systems.nonos.…`, `operator.…`, or `capsule.…`. Reserved on-chain in `NamespaceRegistry`.
- **Stake receipt** — local typed-data bundle: position + both operator IDs + a body digest. Sign it as EIP-712 to make it portable.
- **Local verification** — recompute everything from the receipt and reject mismatches. No backend involved. The SDK's `receiptDigest` is intentionally distinct from the contract's `stakeReceiptDigest`.
- **Kernel separation** — nothing in this SDK signs `CapsuleManifest` or kernel grants. That's a separate runtime.

## The `Nox` class

```ts
const nox = Nox.mainnet();   // or new Nox({ deployment: customDeployment })

nox.namespace.hash("operator.alice");
nox.namespace.type("operator.alice");     // "operator"

nox.tier.fromNox("100000");                // 4 (Operator)
nox.tier.nameFromNox("100000");            // "Operator"

nox.operator.id({ wallet, positionId: 0n });
// { onchain: "0x…", offchain: "0x…" }

const proof = nox.proof.build({
  wallet, positionId: 0n,
  amount: "10000",                         // decimal NOX string, OR bigint wei
  lockUntil: new Date("2030-01-01"),       // Date | bigint | number
  issuedAt:  new Date(),
  boostBps: 1500, tier: 3,
}, "operator.alice");

nox.proof.verify(proof.receipt, proof.digest).valid;

nox.eligibility.gateNox("capsule-tooling", "10000");   // true

nox.safe.tx("0xstaking…", "0xdeadbeef");
```

## The `NoxLive` client (optional, opt-in)

```ts
const live = nox.connect("https://eth-mainnet.example/v2/<KEY>");

await live.staking.version();        // "4.0.0"
await live.staking.stats();          // typed StakingStats
await live.staking.health();         // typed StakingHealth
await live.namespace.ownerOf("operator.alice");
await live.access.has(wallet, 1);
await live.token.balanceOf(wallet);
```

No transactions. Reads only. Use `ethers` / `viem` / your own client for writes.

## Live mainnet (chain 1)

```ts
import { MAINNET_DEPLOYMENT } from "@nonos/nox-staking-sdk";

MAINNET_DEPLOYMENT.stakingProxy        // 0xa94d6009790Ba13597A1E1b7cF4e1531eA513613
MAINNET_DEPLOYMENT.stakingImpl         // 0x415790B1f0aecd18B24D53BEaa25597573375B63
MAINNET_DEPLOYMENT.namespaceRegistry   // 0xD554ae30A0D20CB988c40d6C3b3d907740B9FD5C
MAINNET_DEPLOYMENT.accessRegistry      // 0x31140F839E2BB03C903ca894A87DF40c7333d38b
MAINNET_DEPLOYMENT.token               // 0x0a26c80Be4E060e688d7C23aDdB92cBb5D2C9eCA
MAINNET_DEPLOYMENT.safe                // 0x3a52eA60F61036aFBBeC25F46A64485aC4477CCC
```

## Browser

```tsx
import { Nox } from "@nonos/nox-staking-sdk";
const nox = Nox.mainnet();
document.body.innerText = nox.namespace.hash("operator.alice");
```

Works in Vite / Webpack 5 / esbuild / Rollup / Next.js without bundler config.

## Documentation

Guides ship inside the package. After `npm install`, find them at `node_modules/@nonos/nox-staking-sdk/docs/`.

- Quickstart: [./docs/QUICKSTART.md](./docs/QUICKSTART.md)
- Recipes: [./docs/RECIPES.md](./docs/RECIPES.md)
- Browser usage: [./docs/guides/browser.md](./docs/guides/browser.md)
- Read on-chain state: [./docs/guides/read-onchain.md](./docs/guides/read-onchain.md)
- Namespace guide: [./docs/guides/namespace.md](./docs/guides/namespace.md)
- Sign receipt: [./docs/guides/sign-receipt.md](./docs/guides/sign-receipt.md)
- Eligibility gates: [./docs/guides/eligibility.md](./docs/guides/eligibility.md)
- Safe propose flow: [./docs/guides/safe-propose.md](./docs/guides/safe-propose.md)
- Nym / SOCKS5 routing: [./docs/guides/nym.md](./docs/guides/nym.md)

Repository: <https://github.com/NON-OS/noxcli-sdk>

## SDK ↔ CLI

| | |
|---|---|
| `@nonos/nox-staking-sdk` | this package — TypeScript/JavaScript |
| `noxctl` | native CLI in the same repo — signs receipts, proposes Safe txs, decodes live state |
| `@nonos/nox-core-wasm` | optional WASM build of the deterministic primitives |

The SDK and CLI produce **byte-identical** operator IDs, namespace hashes, receipt digests, and EIP-712 typed-data digests. Both are cross-checked in CI against `ethers.TypedDataEncoder.hash`.

## Primitives (advanced)

Lower-level functions are still exported for power users who don't want the `Nox` facade:

```ts
import {
  namespaceHash, tierFor, tierName,
  onchainOperatorId, offchainOperatorId,
  makeReceipt, receiptDigest, buildProof, verifyReceipt,
  safeTx,
} from "@nonos/nox-staking-sdk";
```

## License

AGPL-3.0-or-later.
