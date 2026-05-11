# Quickstart

Build your first NOX proof in 30 seconds.

## Install

```bash
npm install @nonos/nox-staking-sdk
```

## Hello world

```ts
import { Nox } from "@nonos/nox-staking-sdk";

const nox = Nox.mainnet();

const proof = nox.proof.build({
  wallet:     "0xYourWallet…",
  positionId: 0n,
  amount:     "10000",          // 10,000 NOX as a decimal string
  lockUntil:  new Date("2030-01-01"),
  issuedAt:   new Date(),
  boostBps:   1500,
  tier:       nox.tier.fromNox("10000"),
}, "operator.alice");

console.log(proof.onchainOperatorId);
console.log(proof.digest);
console.log(nox.proof.verify(proof.receipt, proof.digest).valid);   // true
```

That's a complete, self-verifiable ecosystem credential, derived locally with no network call.

## Next

- [Sign a receipt](guides/sign-receipt.md) with a keystore.
- [Read mainnet state](guides/read-onchain.md) via `nox.connect(rpcUrl)`.
- [Browser / Vite setup](guides/browser.md).
- [Recipes](RECIPES.md) — copy-paste snippets.
