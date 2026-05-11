# @nonos/nox-staking-sdk

TypeScript SDK for NOX staking identity, receipts, namespaces, tiers, and pinned V4 mainnet deployment constants.

NOX staking grants ecosystem rights. It does not grant kernel capabilities. Runtime authority flows through CapsuleManifest, not this SDK.

## Install

```bash
npm install @nonos/nox-staking-sdk
pnpm add @nonos/nox-staking-sdk
yarn add @nonos/nox-staking-sdk
bun add @nonos/nox-staking-sdk
```

Node.js 20+ is recommended for server-side use. Browser builds are ESM-only and have no native bindings.

## Canonical Links

| Target | URL |
|--------|-----|
| Package | `https://www.npmjs.com/package/@nonos/nox-staking-sdk` |
| Source | `https://github.com/NON-OS/noxcli-sdk/tree/main/packages/nox-staking-sdk` |
| Full SDK docs | `https://github.com/NON-OS/noxcli-sdk/blob/main/docs/SDK.md` |
| Cross-platform install | `https://github.com/NON-OS/noxcli-sdk/blob/main/docs/INSTALL.md` |
| Live staking app | `https://nonos.software/staking/` |

## Use

```ts
import {
  MAINNET_DEPLOYMENT, knownDeployment,
  normalizeNamespace, namespaceHash, namespaceType,
  tierName, tierFor,
  onchainOperatorId, offchainOperatorId,
  makeReceipt, receiptDigest, verifyReceiptShape,
  buildProof, buildProfile,
  verifyReceipt,
  safeTx,
  JONOS_PREVIEW, CAPSULE_TOOLING, OPERATOR_WAITLIST, eligible,
} from "@nonos/nox-staking-sdk";
```

`verifyReceipt(receipt, claimedDigest?)` recomputes both operator IDs and the digest locally. No backend.

`onchainOperatorId(input)` matches `NOXStakingV4.operatorId(wallet, positionId)`.

`receiptDigest(receipt)` is the SDK local proof digest. It is intentionally distinct from the contract's `stakeReceiptDigest(wallet, positionId)`, which hashes the V4 on-chain receipt struct.

## Live Mainnet

```ts
MAINNET_DEPLOYMENT.stakingProxy
MAINNET_DEPLOYMENT.namespaceRegistry
MAINNET_DEPLOYMENT.accessRegistry
MAINNET_DEPLOYMENT.safe
```

The SDK performs no RPC calls. Use these constants with ethers, viem, or your own RPC client.

## License

AGPL-3.0-or-later.
