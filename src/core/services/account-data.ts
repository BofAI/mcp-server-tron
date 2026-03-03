import { toBase58Address } from "./address.js";
import { utils } from "./utils.js";
import { tronGridGet, type TronGridListResponse } from "./trongrid-client.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormattedAccountInfo {
  address: string;
  balance_trx: string;
  account_name: string;
  create_time: number;
  net_usage: number;
  free_net_usage: number;
  energy_usage: number;
  trc20_balances: { address: string; balance: string }[];
  frozen_v2: unknown[];
  votes: unknown[];
}

export interface FormattedTransaction {
  txID: string;
  blockNumber: number;
  blockTimestamp: number;
  type: string;
  from: string;
  to: string;
  amount_trx: string;
  confirmed: boolean;
  fee_trx: string;
  energyUsage: number;
  netUsage: number;
}

export interface FormattedTrc20Transaction {
  transaction_id: string;
  block_timestamp: number;
  from: string;
  to: string;
  value: string;
  value_raw: string;
  token_address: string;
  token_name: string;
  token_symbol: string;
  token_decimals: number;
  type: string;
  confirmed: boolean;
}

export interface FormattedInternalTransaction {
  transaction_id: string;
  internal_transaction_id: string;
  block: number;
  block_timestamp: number;
  from: string;
  to: string;
  callValueInfo: unknown[];
  note: string;
  rejected: boolean;
  confirmed: boolean;
}

export interface NormalizedBalance {
  address: string;
  balance: string;
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function hexToUtf8(hex: string): string {
  if (!hex) return "";
  try {
    return Buffer.from(hex, "hex").toString("utf8");
  } catch {
    return hex;
  }
}

function safeDivide(sun: number | string | undefined, decimals: number): string {
  if (sun === undefined || sun === null) return "0";
  if (decimals === 0) return String(sun);
  const raw = String(sun).replace(/^-/, "");
  const negative = String(sun).startsWith("-");
  const padded = raw.padStart(decimals + 1, "0");
  const intPart = padded.slice(0, padded.length - decimals);
  const fracPart = padded.slice(padded.length - decimals).replace(/0+$/, "");
  const result = fracPart ? `${intPart}.${fracPart}` : intPart;
  return negative ? `-${result}` : result;
}

/**
 * Normalise `{addr: "bal"}` single-key objects into `{address, balance}[]`.
 * Used by both TRC20 balances and token holders endpoints.
 */
export function normalizeKeyValuePairs(
  data: Record<string, string>[] | unknown,
): NormalizedBalance[] {
  if (!Array.isArray(data)) return [];
  return data.map((item: Record<string, string>) => {
    const entries = Object.entries(item);
    if (entries.length === 1) {
      const [address, balance] = entries[0];
      return {
        address: toBase58Address(address),
        balance: String(balance),
      };
    }
    // Already normalised or unexpected shape – pass through
    return {
      address: String(item.address ?? ""),
      balance: String(item.balance ?? "0"),
    };
  });
}

/**
 * Format raw /v1/accounts/{address} response.
 */
export function formatAccountInfo(raw: any): FormattedAccountInfo {
  const d = raw.data?.[0] ?? raw;
  return {
    address: toBase58Address(d.address ?? ""),
    balance_trx: utils.fromSun(d.balance ?? 0),
    account_name: hexToUtf8(d.account_name ?? ""),
    create_time: d.create_time ?? 0,
    net_usage: d.net_usage ?? 0,
    free_net_usage: d.free_net_usage ?? 0,
    energy_usage: d.account_resource?.energy_usage ?? 0,
    trc20_balances: normalizeKeyValuePairs(d.trc20 ?? []),
    frozen_v2: d.frozenV2 ?? [],
    votes: d.votes ?? [],
  };
}

/**
 * Format raw /v1/accounts/{address}/transactions response.
 * Also used for /v1/contracts/{address}/transactions.
 */
export function formatTransactions(raw: any): {
  transactions: FormattedTransaction[];
  count: number;
  fingerprint?: string;
} {
  const data: any[] = raw.data ?? [];

  const transactions: FormattedTransaction[] = data.map((tx: any) => {
    const contract = tx.raw_data?.contract?.[0] ?? {};
    const value = contract.parameter?.value ?? {};
    const fee = tx.cost?.fee ?? 0;

    return {
      txID: tx.txID ?? tx.transaction_id ?? "",
      blockNumber: tx.blockNumber ?? 0,
      blockTimestamp: tx.block_timestamp ?? 0,
      type: contract.type ?? "",
      from: value.owner_address ? toBase58Address(value.owner_address) : "",
      to: value.to_address
        ? toBase58Address(value.to_address)
        : value.contract_address
          ? toBase58Address(value.contract_address)
          : "",
      amount_trx: safeDivide(value.amount, 6),
      confirmed: !tx._unconfirmed,
      fee_trx: safeDivide(fee, 6),
      energyUsage: tx.cost?.energy_usage ?? 0,
      netUsage: tx.cost?.net_usage ?? 0,
    };
  });

  return {
    transactions,
    count: transactions.length,
    ...(raw.meta?.fingerprint ? { fingerprint: raw.meta.fingerprint } : {}),
  };
}

/**
 * Format raw /v1/accounts/{address}/transactions/trc20 response.
 */
export function formatTrc20Transactions(raw: any): {
  transactions: FormattedTrc20Transaction[];
  count: number;
  fingerprint?: string;
} {
  const data: any[] = raw.data ?? [];

  const transactions: FormattedTrc20Transaction[] = data.map((tx: any) => {
    const tokenInfo = tx.token_info ?? {};
    const decimals = Number(tokenInfo.decimals ?? 0);
    const rawValue = tx.value ?? "0";

    return {
      transaction_id: tx.transaction_id ?? "",
      block_timestamp: tx.block_timestamp ?? 0,
      from: tx.from ? toBase58Address(tx.from) : "",
      to: tx.to ? toBase58Address(tx.to) : "",
      value: safeDivide(rawValue, decimals),
      value_raw: String(rawValue),
      token_address: tokenInfo.address ? toBase58Address(tokenInfo.address) : "",
      token_name: tokenInfo.name ?? "",
      token_symbol: tokenInfo.symbol ?? "",
      token_decimals: decimals,
      type: tx.type ?? "",
      confirmed: !tx._unconfirmed,
    };
  });

  return {
    transactions,
    count: transactions.length,
    ...(raw.meta?.fingerprint ? { fingerprint: raw.meta.fingerprint } : {}),
  };
}

/**
 * Format raw internal transactions response.
 * Used by both account and contract internal-transactions endpoints.
 */
export function formatInternalTransactions(raw: any): {
  transactions: FormattedInternalTransaction[];
  count: number;
  fingerprint?: string;
} {
  const data: any[] = raw.data ?? [];

  const transactions: FormattedInternalTransaction[] = data.map((tx: any) => ({
    transaction_id: tx.transaction_id ?? "",
    internal_transaction_id: tx.internal_transaction_id ?? "",
    block: tx.block ?? 0,
    block_timestamp: tx.block_timestamp ?? 0,
    from: tx.caller_address ? toBase58Address(tx.caller_address) : "",
    to: tx.transferTo_address ? toBase58Address(tx.transferTo_address) : "",
    callValueInfo: tx.callValueInfo ?? [],
    note: tx.data?.note ? hexToUtf8(tx.data.note) : "",
    rejected: tx.data?.rejected ?? tx.rejected ?? false,
    confirmed: !tx._unconfirmed,
  }));

  return {
    transactions,
    count: transactions.length,
    ...(raw.meta?.fingerprint ? { fingerprint: raw.meta.fingerprint } : {}),
  };
}

// ---------------------------------------------------------------------------
// Pagination options shared by most endpoints
// ---------------------------------------------------------------------------

export interface PaginationOptions {
  limit?: number;
  fingerprint?: string;
  onlyConfirmed?: boolean;
  onlyUnconfirmed?: boolean;
  orderBy?: string;
  minTimestamp?: number;
  maxTimestamp?: number;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Get account info from TronGrid `/v1/accounts/{address}`.
 */
export async function getAccountInfo(
  address: string,
  options: { onlyConfirmed?: boolean } = {},
  network = "mainnet",
) {
  const raw = await tronGridGet(network, `/v1/accounts/${address}`, {
    only_confirmed: options.onlyConfirmed,
  });
  return formatAccountInfo(raw);
}

/**
 * Get account transactions from TronGrid `/v1/accounts/{address}/transactions`.
 */
export async function getAccountTransactions(
  address: string,
  options: PaginationOptions = {},
  network = "mainnet",
) {
  const raw = await tronGridGet(network, `/v1/accounts/${address}/transactions`, {
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
 * Get account TRC20 transactions from TronGrid `/v1/accounts/{address}/transactions/trc20`.
 */
export async function getAccountTrc20Transactions(
  address: string,
  options: PaginationOptions & { contractAddress?: string } = {},
  network = "mainnet",
) {
  const raw = await tronGridGet(network, `/v1/accounts/${address}/transactions/trc20`, {
    limit: options.limit,
    fingerprint: options.fingerprint,
    only_confirmed: options.onlyConfirmed,
    only_unconfirmed: options.onlyUnconfirmed,
    order_by: options.orderBy,
    min_timestamp: options.minTimestamp,
    max_timestamp: options.maxTimestamp,
    contract_address: options.contractAddress,
  });
  return formatTrc20Transactions(raw);
}

/**
 * Get account internal transactions from TronGrid `/v1/accounts/{address}/internal-transactions`.
 */
export async function getAccountInternalTransactions(
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
 * Get account TRC20 token balances from TronGrid `/v1/accounts/{address}/trc20/balance`.
 * Returns only address + balance pairs, no token metadata.
 */
export async function getAccountTrc20Balances(
  address: string,
  options: { onlyConfirmed?: boolean } = {},
  network = "mainnet",
) {
  const raw = await tronGridGet<TronGridListResponse>(
    network,
    `/v1/accounts/${address}/trc20/balance`,
    { only_confirmed: options.onlyConfirmed },
  );
  return {
    balances: normalizeKeyValuePairs(raw.data ?? []),
    count: (raw.data ?? []).length,
  };
}
