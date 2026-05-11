# Recipes

Short, copy-pasteable snippets. No narrative.

## hash a namespace

```ts
import { Nox } from "@nonos/nox-staking-sdk";
Nox.mainnet().namespace.hash("operator.alice");
```

## classify a stake score

```ts
const nox = Nox.mainnet();
nox.tier.fromNox("100000");        // 4
nox.tier.nameFromNox("100000");    // "Operator"
```

## operator id (matches V4 `operatorId(wallet, positionId)`)

```ts
Nox.mainnet().operator.id({ wallet, positionId: 0n });
// { onchain, offchain }
```

## build + verify a proof bundle

```ts
const nox = Nox.mainnet();
const proof = nox.proof.build({
  wallet, positionId: 0n,
  amount: "10000", lockUntil: new Date("2030-01-01"),
  issuedAt: new Date(), boostBps: 1500, tier: 3,
}, "operator.alice");
nox.proof.verify(proof.receipt, proof.digest).valid;
```

## eligibility gate

```ts
Nox.mainnet().eligibility.gateNox("capsule-tooling", "10000");  // true
```

## live read — staking stats

```ts
const live = Nox.mainnet().connect(rpc);
const stats = await live.staking.stats();
console.log(stats.totalStaked);
```

## live read — namespace owner

```ts
const live = Nox.mainnet().connect(rpc);
await live.namespace.ownerOf("operator.alice");
```

## live read — access mask

```ts
await Nox.mainnet().connect(rpc).access.mask(wallet);
```

## live read — NOX balance

```ts
await Nox.mainnet().connect(rpc).token.balanceOf(wallet);
```

## switch off mainnet (testnet, custom deployment)

```ts
import { Nox } from "@nonos/nox-staking-sdk";
const nox = new Nox({
  deployment: {
    chainId: 11155111, label: "sepolia",
    stakingProxy:      "0x…",
    stakingImpl:       "0x…",
    namespaceRegistry: "0x…",
    accessRegistry:    "0x…",
    token:             "0x…",
    safe:              "0x…",
  },
});
```

## Safe payload (no signing, no broadcast)

```ts
Nox.mainnet().safe.tx("0xstaking…", "0xdeadbeef");
```
