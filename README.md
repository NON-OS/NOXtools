# @nonos/nox-staking-sdk

Client-side verifiable SDK for the **NOX Operator Kit** — stake-backed identity for the NONOS ecosystem. Turns NOX staking positions into portable cryptographic ecosystem credentials for operators, namespaces, JONOS access, and capsule tooling.

## Hard rule

NOX staking grants **ecosystem rights only**. The NØNOS kernel never trusts token balance. Runtime authority comes from a signed `CapsuleManifest`, not from this SDK or any staking position.

## Decentralization

- Deterministic, pure functions for namespaces, tiers, operator IDs, and receipts.
- No telemetry, no analytics, no hidden network calls.
- No mandatory backend. RPC endpoints are caller-selected.
- The SDK does not decide truth. Contracts do.

## Exports

```ts
import {
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

`verifyReceipt(receipt, claimedDigest?)` recomputes both operator IDs and the receipt digest locally and reports any mismatch. No backend involved.

## License

AGPL-3.0-or-later.
