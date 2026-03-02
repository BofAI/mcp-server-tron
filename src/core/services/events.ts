import { getTronWeb } from "./clients.js";

// Use any for the SDK EventResponse type since tronweb doesn't export sub-path types
type EventResult = any;

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
