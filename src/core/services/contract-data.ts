import { getTronWeb } from "./clients.js";
import {
  formatTransactions,
  formatInternalTransactions,
  normalizeKeyValuePairs,
  type PaginationOptions,
} from "./account-data.js";

// ---------------------------------------------------------------------------
// TronGrid GET helper (duplicated privately to avoid circular deps)
// ---------------------------------------------------------------------------

async function tronGridGet<T = unknown>(
  network: string,
  path: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const tronWeb = getTronWeb(network);
  const cleanParams: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      cleanParams[key] = value;
    }
  }
  return tronWeb.fullNode.request(path, cleanParams, "get") as Promise<T>;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Get contract transactions from TronGrid `/v1/contracts/{address}/transactions`.
 */
export async function getContractTransactions(
  address: string,
  options: PaginationOptions = {},
  network = "mainnet",
) {
  const raw = await tronGridGet(network, `/v1/contracts/${address}/transactions`, {
    limit: options.limit,
    fingerprint: options.fingerprint,
    only_confirmed: options.onlyConfirmed,
    only_unconfirmed: options.onlyUnconfirmed,
    order_by: options.orderBy,
    min_timestamp: options.minTimestamp,
    max_timestamp: options.maxTimestamp,
  });
  return formatTransactions(raw);
}

/**
 * Get contract internal transactions from TronGrid `/v1/accounts/{address}/internal-transactions`.
 * Note: TronGrid uses the accounts path for contract internal transactions as well.
 */
export async function getContractInternalTransactions(
  address: string,
  options: PaginationOptions = {},
  network = "mainnet",
) {
  const raw = await tronGridGet(network, `/v1/accounts/${address}/internal-transactions`, {
    limit: options.limit,
    fingerprint: options.fingerprint,
    only_confirmed: options.onlyConfirmed,
    only_unconfirmed: options.onlyUnconfirmed,
    order_by: options.orderBy,
    min_timestamp: options.minTimestamp,
    max_timestamp: options.maxTimestamp,
  });
  return formatInternalTransactions(raw);
}

/**
 * Get TRC20 token holders from TronGrid `/v1/contracts/{address}/tokens`.
 * Returns normalised address + balance pairs.
 */
export async function getTrc20TokenHolders(
  address: string,
  options: { limit?: number; fingerprint?: string; orderBy?: string } = {},
  network = "mainnet",
) {
  const raw = await tronGridGet(network, `/v1/contracts/${address}/tokens`, {
    limit: options.limit,
    fingerprint: options.fingerprint,
    order_by: options.orderBy,
  });
  const data = (raw as any).data ?? [];
  return {
    holders: normalizeKeyValuePairs(data),
    total: data.length,
    ...((raw as any).meta?.fingerprint ? { fingerprint: (raw as any).meta.fingerprint } : {}),
  };
}
