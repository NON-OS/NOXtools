import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex, rawBytes } from "./hex.js";
import { addressWord } from "./word.js";

export interface DecodedRevertArg {
  name: string;
  kind: string;
  value: string;
}

export interface DecodedRevert {
  known: boolean;
  kind: "standard" | "custom" | "unknown";
  name?: string | undefined;
  signature?: string | undefined;
  selector?: string | undefined;
  args: DecodedRevertArg[];
  raw: string;
}

interface ErrorSpec {
  name: string;
  signature: string;
  args: { name: string; kind: "address" | "uint256" | "bytes32" }[];
}

export function errorSelector(signature: string): `0x${string}` {
  return bytesToHex(keccak_256(new TextEncoder().encode(signature)).subarray(0, 4)) as `0x${string}`;
}

export function decodeRevert(data: string): DecodedRevert {
  let raw: Uint8Array;
  try {
    raw = rawBytes(data);
  } catch {
    return unknown(data);
  }
  const selector = raw.length >= 4 ? bytesToHex(raw.subarray(0, 4)) : undefined;
  const body = raw.subarray(4);
  if (selector === errorSelector("Error(string)")) {
    try {
      return standardString(selector, data, body);
    } catch {
      return unknown(data, selector);
    }
  }
  if (selector === errorSelector("Panic(uint256)")) {
    try {
      return {
        known: true,
        kind: "standard",
        name: "Panic",
        signature: "Panic(uint256)",
        selector,
        args: [{ name: "code", kind: "uint256", value: wordValue("uint256", body.subarray(0, 32)) }],
        raw: data,
      };
    } catch {
      return unknown(data, selector);
    }
  }
  const spec = ERRORS.find((e) => errorSelector(e.signature) === selector);
  if (!spec) return unknown(data, selector);
  try {
    return { known: true, kind: "custom", name: spec.name, signature: spec.signature, selector, args: decodeArgs(spec, body), raw: data };
  } catch {
    return unknown(data, selector);
  }
}

function standardString(selector: string, raw: string, body: Uint8Array): DecodedRevert {
  return {
    known: true,
    kind: "standard",
    name: "Error",
    signature: "Error(string)",
    selector,
    args: [{ name: "message", kind: "string", value: decodeStringBody(body) }],
    raw,
  };
}

function decodeArgs(spec: ErrorSpec, body: Uint8Array): DecodedRevertArg[] {
  if (body.length % 32 !== 0) throw new Error("error data is not word aligned");
  return spec.args.map((arg, i) => ({
    name: arg.name,
    kind: arg.kind,
    value: wordValue(arg.kind, body.subarray(i * 32, i * 32 + 32)),
  }));
}

/** Max revert reason string length we will decode from untrusted data. */
const MAX_REASON_BYTES = 8_192;

function decodeStringBody(body: Uint8Array): string {
  if (body.length < 64) throw new Error("revert string body too short");
  const offsetWord = uintWord(body.subarray(0, 32));
  if (offsetWord % 32n !== 0n || offsetWord > BigInt(body.length - 32)) {
    throw new Error("revert string offset out of bounds");
  }
  const offset = Number(offsetWord);
  const lenWord = uintWord(body.subarray(offset, offset + 32));
  if (lenWord > BigInt(MAX_REASON_BYTES)) throw new Error("revert string too long");
  const len = Number(lenWord);
  if (offset + 32 + len > body.length) throw new Error("revert string length out of bounds");
  return new TextDecoder().decode(body.subarray(offset + 32, offset + 32 + len));
}

function wordValue(kind: "address" | "uint256" | "bytes32", word: Uint8Array): string {
  if (word.length !== 32) throw new Error("invalid word");
  // Reject dirty upper bytes on address words, matching decode.ts/events.ts via
  // the shared helper (previously this path silently truncated to the low 20B).
  if (kind === "address") return addressWord(word);
  if (kind === "bytes32") return bytesToHex(word);
  return uintWord(word).toString();
}

function uintWord(word: Uint8Array): bigint {
  let value = 0n;
  for (const b of word) value = (value << 8n) | BigInt(b);
  return value;
}

function unknown(raw: string, selector?: string): DecodedRevert {
  return { known: false, kind: "unknown", selector, args: [], raw };
}

const e0 = (name: string): ErrorSpec => ({ name, signature: `${name}()`, args: [] });
const ERRORS: ErrorSpec[] = [
  "ZeroAmount",
  "ZeroAddress",
  "InvalidLockPeriod",
  "PositionLocked",
  "PositionNotFound",
  "PositionNotActive",
  "MaxPositionsReached",
  "GenesisAlreadySet",
  "GenesisNotSet",
  "GenesisInPast",
  "NoRewardsToClaim",
  "TransferFailed",
  "ReentrancyGuard",
  "InsufficientStake",
  "InvalidPenaltyBps",
  "StakeLocked",
  "CannotReduceLock",
  "LockNotExpired",
  "ReserveProtected",
  "InvalidProtectedReserve",
  "NothingToCompound",
  "NotZeroStatePassOwner",
  "AlreadyBound",
  "NotBound",
  "NotEligible",
  "AlreadyReserved",
  "NotNamespaceOwner",
  "ZeroNameHash",
  "InvalidFlag",
].map(e0);

ERRORS.push(
  {
    name: "ERC20InsufficientBalance",
    signature: "ERC20InsufficientBalance(address,uint256,uint256)",
    args: [
      { name: "sender", kind: "address" },
      { name: "balance", kind: "uint256" },
      { name: "needed", kind: "uint256" },
    ],
  },
  {
    name: "ERC20InsufficientAllowance",
    signature: "ERC20InsufficientAllowance(address,uint256,uint256)",
    args: [
      { name: "spender", kind: "address" },
      { name: "allowance", kind: "uint256" },
      { name: "needed", kind: "uint256" },
    ],
  },
  {
    name: "AccessControlUnauthorizedAccount",
    signature: "AccessControlUnauthorizedAccount(address,bytes32)",
    args: [
      { name: "account", kind: "address" },
      { name: "neededRole", kind: "bytes32" },
    ],
  },
  e0("EnforcedPause"),
  e0("ExpectedPause"),
);
