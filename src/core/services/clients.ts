import { TronWeb } from "tronweb";
import { getNetworkConfig } from "../chains.js";

// Cache for clients to avoid recreating them for each request
const clientCache = new Map<string, TronWeb>();

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
  const apiKey = process.env.TRONGRID_API_KEY;

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

/**
 * @deprecated Use signTransaction / buildSignBroadcast from agent-wallet.ts instead.
 * Only used internally by agent-wallet.ts for legacy mode signing.
 */
export function getWallet(privateKey: string, network = "mainnet"): TronWeb {
  const config = getNetworkConfig(network);
  const apiKey = process.env.TRONGRID_API_KEY;

  // TronWeb expects private key without 0x prefix usually, but handles it if present?
  // Let's strip 0x to be safe as TronWeb often prefers clean hex
  const cleanKey = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;

  return new TronWeb({
    fullHost: config.fullNode,
    solidityNode: config.solidityNode,
    eventServer: config.eventServer,
    privateKey: cleanKey,
    headers: apiKey ? { "TRON-PRO-API-KEY": apiKey } : undefined,
  });
}
