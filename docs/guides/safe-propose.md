# Safe-first admin flow

Admin actions never originate from the SDK or the CLI. They originate as a **Safe propose digest** that Safe owners sign through the Safe UI / hardware / WalletConnect.

## SDK side — payload only

```ts
import { Nox } from "@nonos/nox-staking-sdk";

const nox = Nox.mainnet();
const tx  = nox.safe.tx(
  "0xa94d6009790Ba13597A1E1b7cF4e1531eA513613",   // staking proxy
  "0xdeadbeef",                                    // calldata
);
```

`tx` is a Safe-compatible payload `{ to, value, data, operation }`. It carries no digest and no signature.

## CLI — full EIP-712 SafeTx digest

```bash
noxctl safe propose \
  --safe   0x3a52eA60F61036aFBBeC25F46A64485aC4477CCC \
  --to     0xa94d6009790Ba13597A1E1b7cF4e1531eA513613 \
  --data   0xdeadbeef \
  --chain-id 1 \
  --nonce  0
```

Output is JSON containing `safeTxHash`, the full `SafeTxV1` struct, and a no-auto-execute marker. Safe owners use the `safeTxHash` to sign in the Safe UI.

Cross-check: `noxctl`'s digest is byte-identical to `ethers.TypedDataEncoder.hash(...)` (asserted in CI against a pinned vector).

## Inspect the Safe

```bash
noxctl safe inspect --safe 0x3a52eA60F61036aFBBeC25F46A64485aC4477CCC --rpc <url>
```

Decodes `getOwners()`, `getThreshold()`, and `nonce()` into a typed JSON view.
