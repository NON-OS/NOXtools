import { rpcCall, rpcCallValue, type RpcOptions } from "../rpc/index.js";
import { decodeLog, type DecodedLog, type RawLog } from "../abi/events.js";
import { decodeReceipt, type DecodedReceipt } from "../abi/receipt.js";
import { decodeRevert, type DecodedRevert } from "../abi/revert.js";

export interface PreparedEip1559Tx {
  chainId: bigint;
  from: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
  data: `0x${string}`;
  nonce: bigint;
  gasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

export interface TransactionSigner {
  address: `0x${string}`;
  signTransaction(tx: PreparedEip1559Tx): Promise<`0x${string}`>;
}

export interface PreparedTxResult {
  tx: PreparedEip1559Tx;
  simulationResult: string;
}

export interface BroadcastResult {
  transactionHash: string;
  receipt?: DecodedReceipt;
}

export interface EndpointPlan {
  schemaVersion: 1;
  rpcEndpoint: string;
  networkCalls: boolean;
  fallbackRpc: null;
  telemetry: false;
}

export function txSurface(rpcUrl: string, opts: RpcOptions = {}) {
  const call = (method: string, params: unknown[]) => rpcCall(rpcUrl, method, params, opts);
  const callValue = (method: string, params: unknown[]) => rpcCallValue(rpcUrl, method, params, opts);
  return {
    async prepare(from: `0x${string}`, to: `0x${string}`, data: `0x${string}`): Promise<PreparedTxResult> {
      assertAddress(from, "from");
      assertAddress(to, "to");
      assertHexData(data, "data");
      const value = 0n;
      const simulationResult = await call("eth_call", [{ from, to, value: hex(value), data }, "latest"]);
      const [chainId, nonce, gasLimit, priority, baseFee] = await Promise.all([
        call("eth_chainId", []).then(hexToBigint),
        call("eth_getTransactionCount", [from, "pending"]).then(hexToBigint),
        call("eth_estimateGas", [{ from, to, value: hex(value), data }]).then(hexToBigint),
        call("eth_maxPriorityFeePerGas", []).then(hexToBigint),
        latestBaseFee(callValue),
      ]);
      return {
        simulationResult,
        tx: {
          chainId,
          from,
          to,
          value,
          data,
          nonce,
          gasLimit,
          maxPriorityFeePerGas: priority,
          maxFeePerGas: baseFee * 2n + priority,
        },
      };
    },

    async sign(signer: TransactionSigner, tx: PreparedEip1559Tx): Promise<`0x${string}`> {
      if (signer.address.toLowerCase() !== tx.from.toLowerCase()) {
        throw new Error("signer address does not match tx.from");
      }
      return signer.signTransaction(tx);
    },

    async broadcast(raw: `0x${string}`): Promise<string> {
      assertRawTx(raw);
      return call("eth_sendRawTransaction", [raw]);
    },

    decodeRevert(data: string): DecodedRevert {
      return decodeRevert(data);
    },

    decodeLog(log: RawLog): DecodedLog {
      return decodeLog(log);
    },

    decodeReceipt(value: unknown): DecodedReceipt {
      return decodeReceipt(value);
    },

    privacyReport(networkCalls = true): EndpointPlan {
      return {
        schemaVersion: 1,
        rpcEndpoint: rpcUrl,
        networkCalls,
        fallbackRpc: null,
        telemetry: false,
      };
    },

    async waitReceipt(transactionHash: string, polls = 60, delayMs = 2000): Promise<DecodedReceipt | undefined> {
      if (!/^0x[0-9a-fA-F]{64}$/.test(transactionHash)) throw new Error("invalid transaction hash");
      if (!Number.isInteger(polls) || polls < 1 || polls > MAX_POLLS) {
        throw new Error(`polls must be an integer between 1 and ${MAX_POLLS}`);
      }
      if (!Number.isInteger(delayMs) || delayMs < MIN_POLL_DELAY_MS || delayMs > MAX_POLL_DELAY_MS) {
        throw new Error(`delayMs must be an integer between ${MIN_POLL_DELAY_MS} and ${MAX_POLL_DELAY_MS}`);
      }
      for (let i = 0; i < polls; i++) {
        const receipt = await rpcReceipt(callValue, transactionHash);
        if (receipt) {
          const decoded = decodeReceipt(receipt);
          assertReceiptHash(decoded, transactionHash);
          return decoded;
        }
        await delay(delayMs);
      }
      return undefined;
    },

    async sendAndWait(raw: `0x${string}`, wait = false): Promise<BroadcastResult> {
      assertRawTx(raw);
      const transactionHash = await call("eth_sendRawTransaction", [raw]);
      const receipt = wait ? await this.waitReceipt(transactionHash) : undefined;
      return receipt === undefined ? { transactionHash } : { transactionHash, receipt };
    },
  };
}

async function latestBaseFee(call: (method: string, params: unknown[]) => Promise<unknown>): Promise<bigint> {
  const block = await call("eth_getBlockByNumber", ["latest", false]);
  if (!isRecord(block)) throw new Error("invalid latest block result");
  const fee = block["baseFeePerGas"];
  if (typeof fee !== "string") throw new Error("missing baseFeePerGas");
  return hexToBigint(fee);
}

/**
 * A hostile node can return a (successful) receipt for an UNRELATED tx in
 * response to eth_getTransactionReceipt(ourHash). Reject any receipt whose
 * transactionHash does not match the hash we queried (case-insensitive: nodes
 * return mixed case).
 */
function assertReceiptHash(receipt: DecodedReceipt, requested: string): void {
  const got = receipt.transactionHash;
  if (typeof got !== "string" || got.toLowerCase() !== requested.toLowerCase()) {
    throw new Error("receipt transactionHash does not match requested hash");
  }
}

async function rpcReceipt(
  call: (method: string, params: unknown[]) => Promise<unknown>,
  hash: string,
): Promise<unknown | undefined> {
  const receipt = await call("eth_getTransactionReceipt", [hash]);
  return receipt === null ? undefined : receipt;
}

const MAX_POLLS = 1_000;
const MIN_POLL_DELAY_MS = 50;
const MAX_POLL_DELAY_MS = 300_000;
/** A raw signed EIP-1559 tx fits well under 128 KiB of hex. */
const MAX_RAW_TX_CHARS = 262_146;

function assertAddress(value: string, label: string): void {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) throw new Error(`invalid ${label} address`);
}

function assertHexData(value: string, label: string): void {
  if (!/^0x(?:[0-9a-fA-F]{2})*$/.test(value)) throw new Error(`invalid ${label} hex`);
}

function assertRawTx(raw: string): void {
  if (!/^0x(?:[0-9a-fA-F]{2})+$/.test(raw)) {
    throw new Error("raw transaction must be 0x-prefixed hex bytes");
  }
  if (raw.length > MAX_RAW_TX_CHARS) throw new Error("raw transaction too large");
}

function hexToBigint(value: string): bigint {
  // Ethereum quantities are at most 32 bytes; reject anything longer to avoid huge BigInts.
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(value)) throw new Error("invalid hex quantity");
  return BigInt(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hex(value: bigint): string {
  return `0x${value.toString(16)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
