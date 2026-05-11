# Namespaces

A namespace is a deterministic identifier owned by a wallet+position pair, registered on-chain in `NamespaceRegistry`.

## Allowed shapes

- `systems.nonos.<project>` — reserved for NØNOS systems.
- `operator.<name>` — for operators.
- `capsule.<name>` — for capsules.

Rules: lowercase letters, digits, `.`, `-`. Max 96 chars.

## Derive the hash

```ts
import { Nox } from "@nonos/nox-staking-sdk";

const nox = Nox.mainnet();
nox.namespace.normalize("Operator.Alice");   // "operator.alice"
nox.namespace.type("operator.alice");        // "operator"
nox.namespace.hash("operator.alice");        // "0x..." keccak256
```

## Check ownership on-chain

```ts
const live  = nox.connect(rpc);
const owner = await live.namespace.ownerOf("operator.alice");
if (owner === "0x0000000000000000000000000000000000000000") {
  // unclaimed
}

const canIClaim = await live.namespace.canReserve(wallet, positionId, "operator.alice");
```

## Reserve a namespace (write path)

Reservation is a contract transaction (`reserveNamespace(nameHash, positionId)`) — that's outside the SDK. Build the calldata via your transaction tool of choice (ethers, viem) using `nox.namespace.hash(name)` as the `bytes32 nameHash` argument.

## Verify a claim locally

If someone hands you a namespace + position + receipt, you can verify everything offline:

```ts
const proof = nox.proof.build({ ...position, /* … */ }, "operator.alice");
nox.proof.verify(proof.receipt, proof.digest).valid;  // true if intact
```
