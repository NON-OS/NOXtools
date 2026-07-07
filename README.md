# NOX staking tools

Local-first tools for staking NOX on Ethereum mainnet. Your keys, your RPC, no
servers, no telemetry. Two pieces, one repository:

- **Dashboard** (app, for stakers) - `@nonos/nox-dashboard`. A browser UI you
  run on your own machine.
- **SDK** (library, for builders) - `@nonos/nox-staking-sdk`. Typed calldata,
  live reads, receipts, and hashing. This package.

Stake NOX without trusting a website.

## Stakers: run the dashboard

One command. It runs on your machine, connects your own RPC and wallet, and is
built on the SDK below.

```bash
npx @nonos/nox-dashboard
```

Source: <https://github.com/NON-OS/NOXDashboard> (mounted in this repo under
`dashboard/`). Hosted copy: <https://staking.nonos.software>, byte-identical to
what you run yourself.

## Builders: use the SDK

```ts
import { Nox } from "@nonos/nox-staking-sdk";

const nox  = Nox.mainnet();        // pure: hashes, IDs, receipts, eligibility - no network
const live = nox.connect(rpcUrl);  // optional: typed reads of the live mainnet contracts
```

```bash
npm  install @nonos/nox-staking-sdk
pnpm add     @nonos/nox-staking-sdk
yarn add     @nonos/nox-staking-sdk
bun  add     @nonos/nox-staking-sdk
```

Node 20+. ESM only. Browser-safe (only crypto dependency is `@noble/hashes`).

NOX staking grants ecosystem rights. It does not grant kernel capabilities.
Runtime authority flows through `CapsuleManifest`, not this SDK.

## Concepts

- **Operator ID** - deterministic identifier for a `(wallet, positionId)` pair. The on-chain variant matches `NOXStakingV4.operatorId(wallet, positionId)` exactly. The off-chain variant adds chainId + staking contract for off-chain namespacing.
- **Namespace** - string under `systems.nonos....`, `operator....`, or `capsule....`. Reserved on-chain in `NamespaceRegistry`.
- **Stake receipt** - local typed-data bundle: position + both operator IDs + a body digest. Sign it as EIP-712 to make it portable.
- **Local verification** - recompute everything from the receipt and reject mismatches. No backend involved. The SDK's `receiptDigest` is intentionally distinct from the contract's `stakeReceiptDigest`.
- **Kernel separation** - nothing in this SDK signs `CapsuleManifest` or kernel grants. That is a separate runtime.

## The `Nox` class

```ts
const nox = Nox.mainnet();   // or new Nox({ deployment: customDeployment })

nox.namespace.hash("operator.alice");
nox.namespace.type("operator.alice");     // "operator"

nox.tier.fromNox("100000");                // 4 (Operator)
nox.tier.nameFromNox("100000");            // "Operator"

nox.operator.id({ wallet, positionId: 0n });
// { onchain: "0x...", offchain: "0x..." }

const proof = nox.proof.build({
  wallet, positionId: 0n,
  amount: "10000",                         // decimal NOX string, OR bigint wei
  lockUntil: new Date("2030-01-01"),       // Date | bigint | number
  issuedAt:  new Date(),
  boostBps: 1500, tier: 3,
}, "operator.alice");

nox.proof.verify(proof.receipt, proof.digest).valid;

nox.eligibility.gateNox("capsule-tooling", "10000");   // true

nox.safe.tx("0xstaking...", "0xdeadbeef");
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

`live.tx` prepares an EIP-1559 transaction plan for calldata you provide:

```ts
const plan = await live.tx.prepare(wallet, MAINNET_DEPLOYMENT.stakingProxy, nox.calldata.staking.stake(amountWei));
const raw  = await live.tx.sign(injectedSigner, plan.tx);
const sent = await live.tx.sendAndWait(raw, true);
```

The SDK does not load private keys or own secret material. Signing is only
through an injected signer implementing `{ address, signTransaction(tx) }`.

### Manage a stake

Every write is the same three steps: prepare (simulates on your RPC), sign (via
your injected signer), send.

```ts
import { Nox, MAINNET_DEPLOYMENT } from "@nonos/nox-staking-sdk";

const nox     = Nox.mainnet();
const live    = nox.connect(rpcUrl);
const staking = MAINNET_DEPLOYMENT.stakingProxy;
const amount  = 100n * 10n ** 18n;                 // 100 NOX in wei

const plan = await live.tx.prepare(wallet, staking, nox.calldata.staking.stake(amount));
const raw  = await live.tx.sign(injectedSigner, plan.tx);  // SDK holds no keys
const { transactionHash, receipt } = await live.tx.sendAndWait(raw, true);
```

The same pattern covers `approve`, `stakeLocked`, `claimRewards`,
`compoundRewards`, `unstakePosition`, and `earlyUnlock`. Full lifecycle -
approve, stake (flexible and locked), claim, compound, exit, and the
early-unlock penalty - is in [Stake and manage a position](./docs/guides/stake.md).

Receipt and revert helpers expose decoded and raw forms:

```ts
const decodedReceipt = live.tx.decodeReceipt(rawReceipt);
const decodedRevert = live.tx.decodeRevert("0x...");
const endpointPlan = live.tx.privacyReport(false);
```

`privacyReport(false)` performs no network request. Constructors do not perform
network I/O; explicit methods do.

## Live mainnet (chain 1)

```ts
import { MAINNET_DEPLOYMENT } from "@nonos/nox-staking-sdk";

MAINNET_DEPLOYMENT.stakingProxy        // 0xa94d6009790Ba13597A1E1b7cF4e1531eA513613
MAINNET_DEPLOYMENT.stakingImpl         // 0x415790B1f0aecd18B24D53BEaa25597573375B63
MAINNET_DEPLOYMENT.namespaceRegistry   // 0xD554ae30A0D20CB988c40d6C3b3d907740B9FD5C
MAINNET_DEPLOYMENT.accessRegistry      // 0x31140F839E2BB03C903ca894A87DF40c7333d38b
MAINNET_DEPLOYMENT.token               // 0x0a26c80Be4E060e688d7C23aDdB92cBb5D2C9eCA
MAINNET_DEPLOYMENT.safe                // 0x3a52ea60F61036Afbbec25F46a64485Ac4477Ccc
```

## Security and sovereignty

- Your keys never leave your machine. The SDK holds no secret material; signing
  is only through a signer you inject.
- Your RPC only. No fallback endpoint is ever used.
- No telemetry, no analytics, no third-party calls.
- Nothing is broadcast without your explicit action.
- Every value decoded from an RPC response is bounds-checked; hostile-input and
  malicious-endpoint cases are covered by an adversarial test suite that runs in
  CI on Linux, macOS, and Windows.
- Safe and hardware wallet flows are supported through `nox.safe.tx` and
  `nox.calldata` for balances that warrant them.

## Documentation

Guides ship inside the package. After `npm install`, find them at
`node_modules/@nonos/nox-staking-sdk/docs/`.

- Quickstart: [./docs/QUICKSTART.md](./docs/QUICKSTART.md)
- Recipes: [./docs/RECIPES.md](./docs/RECIPES.md)
- Stake and manage a position: [./docs/guides/stake.md](./docs/guides/stake.md)
- Browser usage: [./docs/guides/browser.md](./docs/guides/browser.md)
- Read on-chain state: [./docs/guides/read-onchain.md](./docs/guides/read-onchain.md)
- Namespace guide: [./docs/guides/namespace.md](./docs/guides/namespace.md)
- Sign receipt: [./docs/guides/sign-receipt.md](./docs/guides/sign-receipt.md)
- Eligibility gates: [./docs/guides/eligibility.md](./docs/guides/eligibility.md)
- Safe propose flow: [./docs/guides/safe-propose.md](./docs/guides/safe-propose.md)
- Nym / SOCKS5 routing: [./docs/guides/nym.md](./docs/guides/nym.md)

## Primitives (advanced)

Lower-level functions are exported for callers who do not want the `Nox` facade:

```ts
import {
  namespaceHash, tierFor, tierName,
  onchainOperatorId, offchainOperatorId,
  makeReceipt, receiptDigest, buildProof, verifyReceipt,
  safeTx,
} from "@nonos/nox-staking-sdk";
```

## Build from source

```bash
# --recursive also checks out the dashboard app under dashboard/
git clone --recursive https://github.com/NON-OS/NOXtools.git
cd NOXtools

npm install
npm run build   # tsc -> dist/
npm test        # vitest, incl. the adversarial suite
```

The SDK builds standalone; the `dashboard/` submodule is only needed if you want
to build the app too (`cd dashboard && npm install && npm run build`). If you
already cloned without `--recursive`, run `git submodule update --init`.

## License

AGPL-3.0-or-later. The source is public so you can read it, build it, and run it
yourself.
