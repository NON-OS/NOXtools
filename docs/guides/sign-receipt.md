# Sign a receipt

The SDK builds and verifies receipts. **Signing happens in your wallet** (or via `noxctl receipt sign` for keystore flows).

## Build the typed-data payload

```ts
import { Nox } from "@nonos/nox-staking-sdk";

const nox = Nox.mainnet();

const proof = nox.proof.build({
  wallet:     "0xYourWallet…",
  positionId: 0n,
  amount:     "10000",
  lockUntil:  new Date("2030-01-01"),
  issuedAt:   new Date(),
  boostBps:   1500,
  tier:       3,
});
```

`proof.receipt` is the EIP-712 message. The domain is `{ name: "NOX Operator Kit", version: "1", chainId: 1, verifyingContract: stakingProxy }`.

## Sign with ethers v6

```ts
import { Wallet } from "ethers";

const signer = new Wallet(process.env.PK!);   // dev only

const sig = await signer.signTypedData(
  { name: "NOX Operator Kit", version: "1", chainId: nox.chainId, verifyingContract: nox.deployment.stakingProxy },
  {
    NoxStakeReceipt: [
      { name: "wallet",            type: "address" },
      { name: "chainId",           type: "uint256" },
      { name: "stakingContract",   type: "address" },
      { name: "positionId",        type: "uint256" },
      { name: "amount",            type: "uint256" },
      { name: "lockUntil",         type: "uint256" },
      { name: "boostBps",          type: "uint32"  },
      { name: "tier",              type: "uint8"   },
      { name: "issuedAt",          type: "uint256" },
      { name: "onchainOperatorId", type: "bytes32" },
      { name: "offchainOperatorId",type: "bytes32" },
    ],
  },
  proof.receipt,
);
```

## Sign with `noxctl` (keystore, hardware-ish)

```bash
noxctl receipt sign --keystore ./operator.json \
  --wallet 0xYourWallet --staking <stakingProxy> --chain-id 1 \
  --position 0 --amount 10000000000000000000000 --lock-until 1900000000 \
  --boost-bps 1500 --tier 3 --issued-at 1700000000 > signed.json
```

## Verify locally

```ts
nox.proof.verify(proof.receipt, proof.digest).valid;     // local checks
```

The full signature recovery + check pipeline lives in the CLI:

```bash
noxctl receipt verify signed.json
```

The CLI recomputes operator IDs, the body digest, the EIP-712 typed-data digest, recovers the signer, and rejects mismatches in wallet / chain / staking / digest / signer.
