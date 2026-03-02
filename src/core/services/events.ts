import { getTronWeb } from "./clients.js";
import { toBase58Address } from "./address.js";

// Use any for the SDK EventResponse type since tronweb doesn't export sub-path types
type EventResult = any;

export interface FormattedEvent {
  eventName: string;
  signature: string;
  transactionId: string;
  blockNumber: number;
  blockTimestamp: number;
  contractAddress: string;
  callerContractAddress: string;
  confirmed: boolean;
  params: Record<string, string>;
}

export interface FormattedEventResponse {
  events: FormattedEvent[];
  totalEvents: number;
  fingerprint?: string;
}

/**
 * Convert a hex address (0x-prefixed) to TRON base58 format.
 * Returns the original value if not a hex address.
 */
function hexToBase58(value: string): string {
  if (typeof value === "string" && value.startsWith("0x") && value.length === 42) {
    try {
      return toBase58Address("41" + value.slice(2));
    } catch {
      return value;
    }
  }
  return value;
}

/**
 * Format raw event data into a clean, LLM-friendly structure:
 * - Removes duplicate positional keys (0, 1, 2...) from result
 * - Converts hex addresses to base58 in params
 * - Flattens result_type into params as "name (type): value"
 * - Inverts _unconfirmed to confirmed
 */
export function formatEventData(raw: EventResult): FormattedEventResponse {
  const data: any[] = raw.data ?? [];

  const events: FormattedEvent[] = data.map((e: any) => {
    const result: Record<string, string> = e.result ?? {};
    const resultType: Record<string, string> = e.result_type ?? {};

    // Build clean params: skip numeric index keys, convert hex addresses
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(result)) {
      if (/^\d+$/.test(key)) continue; // skip positional keys
      const typ = resultType[key];
      const displayValue = typ === "address" ? hexToBase58(value as string) : (value as string);
      params[typ ? `${key} (${typ})` : key] = displayValue;
    }

    return {
      eventName: e.event_name,
      signature: e.event,
      transactionId: e.transaction_id,
      blockNumber: e.block_number,
      blockTimestamp: e.block_timestamp,
      contractAddress: e.contract_address,
      callerContractAddress: e.caller_contract_address,
      confirmed: !e._unconfirmed,
      params,
    };
  });

  return {
    events,
    totalEvents: events.length,
    ...(raw.meta?.fingerprint ? { fingerprint: raw.meta.fingerprint } : {}),
  };
}

/**
 * Get events emitted by a specific transaction
 */
export async function getEventsByTransactionId(
  transactionId: string,
  options: { onlyConfirmed?: boolean } = {},
  network = "mainnet",
): Promise<EventResult> {
  const tronWeb = getTronWeb(network);
  return tronWeb.event.getEventsByTransactionID(transactionId, {
    only_confirmed: options.onlyConfirmed,
  });
}

/**
 * Get events emitted by a specific contract address
 */
export async function getEventsByContractAddress(
  contractAddress: string,
  options: {
    eventName?: string;
    limit?: number;
    fingerprint?: string;
    onlyConfirmed?: boolean;
    orderBy?: "block_timestamp,desc" | "block_timestamp,asc";
  } = {},
  network = "mainnet",
): Promise<EventResult> {
  const tronWeb = getTronWeb(network);
  return tronWeb.event.getEventsByContractAddress(contractAddress, {
    eventName: options.eventName,
    limit: options.limit ?? 20,
    fingerprint: options.fingerprint,
    onlyConfirmed: options.onlyConfirmed,
    orderBy: options.orderBy,
  });
}

/**
 * Get events from a specific block number
 */
export async function getEventsByBlockNumber(
  blockNumber: number,
  options: { onlyConfirmed?: boolean; limit?: number; fingerprint?: string } = {},
  network = "mainnet",
): Promise<EventResult> {
  const tronWeb = getTronWeb(network);
  return tronWeb.event.getEventsByBlockNumber(blockNumber, {
    only_confirmed: options.onlyConfirmed,
    limit: options.limit,
    fingerprint: options.fingerprint,
  });
}

/**
 * Get events from the latest block
 */
export async function getEventsOfLatestBlock(
  options: { onlyConfirmed?: boolean } = {},
  network = "mainnet",
): Promise<EventResult> {
  const tronWeb = getTronWeb(network);
  return tronWeb.event.getEventsOfLatestBlock({
    only_confirmed: options.onlyConfirmed,
  });
}
