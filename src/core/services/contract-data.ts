import {
  formatTransactions,
  formatInternalTransactions,
  normalizeKeyValuePairs,
  type PaginationOptions,
} from "./account-data.js";
import { tronGridGet, type TronGridListResponse } from "./trongrid-client.js";

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
  const raw = await tronGridGet<TronGridListResponse>(network, `/v1/contracts/${address}/tokens`, {
    limit: options.limit,
    fingerprint: options.fingerprint,
    order_by: options.orderBy,
  });
  const data = raw.data ?? [];
  return {
    holders: normalizeKeyValuePairs(data),
    count: data.length,
    ...(raw.meta?.fingerprint ? { fingerprint: raw.meta.fingerprint } : {}),
  };
}
