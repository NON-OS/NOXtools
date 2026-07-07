import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex, rawBytes } from "./hex.js";
import { addressWord } from "./word.js";

type AbiKind = "address" | "uint256" | "uint8" | "bytes32" | "bool";

export interface RawLog {
  address: string;
  topics: string[];
  data: string;
}

export interface DecodedLogArg {
  name: string;
  kind: AbiKind;
  indexed: boolean;
  value: string | boolean;
}

export interface DecodedLog {
  known: boolean;
  name?: string;
  signature?: string;
  args: DecodedLogArg[];
  raw: RawLog;
}

interface ArgSpec {
  name: string;
  kind: AbiKind;
  indexed: boolean;
}

interface EventSpec {
  name: string;
  signature: string;
  args: ArgSpec[];
}

export function eventTopic(signature: string): `0x${string}` {
  return bytesToHex(keccak_256(new TextEncoder().encode(signature))) as `0x${string}`;
}

let topicIndexCache: Map<string, EventSpec> | undefined;

function topicIndex(): Map<string, EventSpec> {
  if (!topicIndexCache) {
    topicIndexCache = new Map(EVENTS.map((event) => [eventTopic(event.signature).toLowerCase(), event]));
  }
  return topicIndexCache;
}

export function decodeLog(input: RawLog): DecodedLog {
  // Sanitize the (attacker-controlled) log through the same coercion the
  // receipt path uses, so a hostile shape (missing/non-array topics, numeric or
  // object topic entries) yields { known:false } instead of an uncaught throw.
  const raw = rawLog(input);
  const topic0 = raw.topics[0]?.toLowerCase();
  const spec = topic0 === undefined ? undefined : topicIndex().get(topic0);
  if (!spec) return { known: false, args: [], raw };
  try {
    return { known: true, name: spec.name, signature: spec.signature, args: decodeArgs(spec, raw), raw };
  } catch {
    return { known: false, args: [], raw };
  }
}

export function decodeLogValue(value: unknown): DecodedLog {
  return decodeLog(value as RawLog);
}

function decodeArgs(spec: EventSpec, raw: RawLog): DecodedLogArg[] {
  const data = rawBytes(raw.data);
  if (data.length % 32 !== 0) throw new Error("event data is not word aligned");
  let topicIndex = 1;
  let dataIndex = 0;
  return spec.args.map((arg) => {
    const word = arg.indexed ? topicWord(raw.topics[topicIndex++]) : dataWord(data, dataIndex++);
    return { name: arg.name, kind: arg.kind, indexed: arg.indexed, value: wordValue(arg.kind, word) };
  });
}

/** A log can carry at most topic0 + 3 indexed topics; anything longer is hostile. */
const MAX_TOPICS = 4;

function rawLog(value: unknown): RawLog {
  const record = isRecord(value) ? value : {};
  const topics = Array.isArray(record.topics)
    ? record.topics.slice(0, MAX_TOPICS).filter((v): v is string => typeof v === "string")
    : [];
  return {
    address: typeof record.address === "string" ? record.address : "",
    topics,
    data: typeof record.data === "string" ? record.data : "0x",
  };
}

function topicWord(topic: string | undefined): Uint8Array {
  if (typeof topic !== "string") throw new Error("missing indexed topic");
  const raw = rawBytes(topic);
  if (raw.length !== 32) throw new Error("invalid indexed topic");
  return raw;
}

function dataWord(data: Uint8Array, index: number): Uint8Array {
  const start = index * 32;
  const end = start + 32;
  if (end > data.length) throw new Error("missing data word");
  return data.subarray(start, end);
}

function wordValue(kind: AbiKind, word: Uint8Array): string | boolean {
  if (kind === "address") return addressWord(word);
  if (kind === "bytes32") return bytesToHex(word);
  if (kind === "bool") return word.some((b) => b !== 0);
  // Fixed uintN: ABI decoders (ethers/viem) mask to the type width. A real chain
  // never sets bytes above bit N, but a hostile node can; mask so e.g. a uint8
  // flag stays in 0..255 instead of leaking a full 256-bit word.
  const bits = Number(kind.slice(4));
  const value = uintWord(word);
  if (bits < 256) return (value & ((1n << BigInt(bits)) - 1n)).toString();
  return value.toString();
}

function uintWord(word: Uint8Array): bigint {
  let value = 0n;
  for (const b of word) value = (value << 8n) | BigInt(b);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const addr = (name: string, indexed: boolean): ArgSpec => ({ name, kind: "address", indexed });
const uint = (name: string, indexed = false): ArgSpec => ({ name, kind: "uint256", indexed });
const bytes32 = (name: string, indexed: boolean): ArgSpec => ({ name, kind: "bytes32", indexed });
const bool = (name: string): ArgSpec => ({ name, kind: "bool", indexed: false });

const EVENTS: EventSpec[] = [
  { name: "Transfer", signature: "Transfer(address,address,uint256)", args: [addr("from", true), addr("to", true), uint("amount")] },
  { name: "Approval", signature: "Approval(address,address,uint256)", args: [addr("owner", true), addr("spender", true), uint("value")] },
  { name: "Staked", signature: "Staked(address,uint256,uint256)", args: [addr("user", true), uint("amount"), uint("weightedAmount")] },
  { name: "StakedLocked", signature: "StakedLocked(address,uint256,uint256,uint256,uint256)", args: [addr("user", true), uint("amount"), uint("weightedAmount"), uint("lockPeriod"), uint("lockEndTime")] },
  { name: "PositionCreated", signature: "PositionCreated(address,uint256,uint256,uint256)", args: [addr("user", true), uint("positionId", true), uint("amount"), uint("lockPeriod")] },
  { name: "PositionUnstaked", signature: "PositionUnstaked(address,uint256,uint256)", args: [addr("user", true), uint("positionId", true), uint("amount")] },
  { name: "EarlyUnlock", signature: "EarlyUnlock(address,uint256,uint256,uint256)", args: [addr("user", true), uint("positionId", true), uint("amount"), uint("penaltyAmount")] },
  { name: "Unstaked", signature: "Unstaked(address,uint256)", args: [addr("user", true), uint("amount")] },
  { name: "RewardsClaimed", signature: "RewardsClaimed(address,uint256)", args: [addr("user", true), uint("amount")] },
  { name: "RewardsClaimedPartial", signature: "RewardsClaimedPartial(address,uint256,uint256)", args: [addr("user", true), uint("paid"), uint("carriedOver")] },
  { name: "RewardsCompounded", signature: "RewardsCompounded(address,uint256,uint256)", args: [addr("user", true), uint("positionId", true), uint("amount")] },
  { name: "ZeroStatePassBound", signature: "ZeroStatePassBound(address,uint256,uint256)", args: [addr("user", true), uint("positionId", true), uint("tokenId")] },
  { name: "ZeroStatePassUnbound", signature: "ZeroStatePassUnbound(address,uint256,uint256)", args: [addr("user", true), uint("positionId", true), uint("tokenId")] },
  { name: "ZeroStatePassRefreshed", signature: "ZeroStatePassRefreshed(address,uint256,bool)", args: [addr("user", true), uint("positionId", true), bool("stillValid")] },
  { name: "NamespaceReserved", signature: "NamespaceReserved(bytes32,address,uint256)", args: [bytes32("nameHash", true), addr("owner", true), uint("positionId", true)] },
  { name: "NamespaceReleased", signature: "NamespaceReleased(bytes32,address)", args: [bytes32("nameHash", true), addr("owner", true)] },
  { name: "AccessGranted", signature: "AccessGranted(address,uint8)", args: [addr("wallet", true), { name: "flag", kind: "uint8", indexed: true }] },
  { name: "AccessRevoked", signature: "AccessRevoked(address,uint8)", args: [addr("wallet", true), { name: "flag", kind: "uint8", indexed: true }] },
  { name: "AccessBulkSet", signature: "AccessBulkSet(address,uint256,uint256)", args: [addr("wallet", true), uint("oldMask"), uint("newMask")] },
  { name: "RoleGranted", signature: "RoleGranted(bytes32,address,address)", args: [bytes32("role", true), addr("account", true), addr("sender", true)] },
  { name: "RoleRevoked", signature: "RoleRevoked(bytes32,address,address)", args: [bytes32("role", true), addr("account", true), addr("sender", true)] },
  { name: "RoleAdminChanged", signature: "RoleAdminChanged(bytes32,bytes32,bytes32)", args: [bytes32("role", true), bytes32("previousAdminRole", true), bytes32("newAdminRole", true)] },
];
