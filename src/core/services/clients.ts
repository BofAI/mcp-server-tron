import { TronWeb } from "tronweb";
import { getNetworkConfig } from "../chains.js";

// Cache for clients to avoid recreating them for each request
const clientCache = new Map<string, TronWeb>();
const TRONGRID_ORIGINS = new Set([
  "https://api.trongrid.io",
  "https://nile.trongrid.io",
  "https://api.shasta.trongrid.io",
]);

/**
 * Get a TronWeb instance for a specific network
 */
export function getTronWeb(network = "mainnet"): TronWeb {
  const cacheKey = String(network);

  // Return cached client if available
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }

  // Create a new client
  const config = getNetworkConfig(network);
  // Never forward the TronGrid credential to a custom RPC destination.
  const apiKey = TRONGRID_ORIGINS.has(new URL(config.fullNode).origin)
    ? process.env.TRONGRID_API_KEY
    : undefined;

  const client = new TronWeb({
    fullHost: config.fullNode,
    solidityNode: config.solidityNode,
    eventServer: config.eventServer,
    headers: apiKey ? { "TRON-PRO-API-KEY": apiKey } : undefined,
  });

  // Set a default address for read-only calls that might require it
  client.setAddress("T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb");

  // Cache the client
  clientCache.set(cacheKey, client);

  return client;
}
