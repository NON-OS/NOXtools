import { decodeLogValue, type DecodedLog } from "./events.js";

export interface DecodedReceipt {
  transactionHash?: string | undefined;
  status?: string | undefined;
  blockNumber?: string | undefined;
  gasUsed?: string | undefined;
  effectiveGasPrice?: string | undefined;
  logs: DecodedLog[];
  eventNames: string[];
  raw: unknown;
}

/** Hard cap on logs decoded from an untrusted receipt. */
const MAX_LOGS = 10_000;

export function decodeReceipt(value: unknown): DecodedReceipt {
  const record = isRecord(value) ? value : {};
  const rawLogs = Array.isArray(record.logs) ? record.logs : [];
  if (rawLogs.length > MAX_LOGS) throw new Error("receipt has too many logs");
  const logs = rawLogs.map(decodeLogValue);
  return {
    transactionHash: stringField(record, "transactionHash"),
    status: stringField(record, "status"),
    blockNumber: stringField(record, "blockNumber"),
    gasUsed: stringField(record, "gasUsed"),
    effectiveGasPrice: stringField(record, "effectiveGasPrice"),
    logs,
    eventNames: logs.map((log) => log.name ?? "UnknownLog"),
    raw: value,
  };
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
