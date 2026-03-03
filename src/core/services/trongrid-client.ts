import { getTronWeb } from "./clients.js";

// ---------------------------------------------------------------------------
// TronGrid response types
// ---------------------------------------------------------------------------

export interface TronGridListResponse<T = unknown> {
  data: T[];
  meta?: { fingerprint?: string };
}

export interface TronGridSingleResponse<T = unknown> {
  data: T[];
}

// ---------------------------------------------------------------------------
// TronGrid GET helper
// ---------------------------------------------------------------------------

/**
 * Perform a GET request against TronGrid v1 API via the cached TronWeb fullNode.
 * Undefined params are silently filtered before being serialised as query-string.
 */
export async function tronGridGet<T = unknown>(
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
