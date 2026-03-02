import { getTronWeb } from "./clients.js";

/**
 * Get list of transaction IDs in the pending pool
 */
export async function getTransactionListFromPending(network = "mainnet"): Promise<string[]> {
  const tronWeb = getTronWeb(network);
  const result = await tronWeb.fullNode.request<{ txId?: string[]; Error?: string }>(
    "/wallet/gettransactionlistfrompending",
    {},
    "get",
  );
  if (result.Error) {
    throw new Error(`TRON API error: ${result.Error}`);
  }
  return result.txId ?? [];
}

/**
 * Get a specific transaction from the pending pool by its ID
 */
export async function getTransactionFromPending(
  txId: string,
  network = "mainnet",
): Promise<Record<string, unknown>> {
  const tronWeb = getTronWeb(network);
  const result = await tronWeb.fullNode.request<Record<string, unknown>>(
    "/wallet/gettransactionfrompending",
    { value: txId },
    "post",
  );
  return result;
}

/**
 * Get the number of transactions in the pending pool
 */
export async function getPendingSize(network = "mainnet"): Promise<number> {
  const tronWeb = getTronWeb(network);
  const result = await tronWeb.fullNode.request<{
    pendingTransactionSize?: number;
    Error?: string;
  }>("/wallet/getpendingsize", {}, "get");
  if (result.Error) {
    throw new Error(`TRON API error: ${result.Error}`);
  }
  return result.pendingTransactionSize ?? 0;
}
