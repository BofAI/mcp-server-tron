import { getTronWeb } from "./clients.js";

/**
 * List all connected node addresses on the network
 */
export async function listNodes(network = "mainnet"): Promise<string[]> {
  const tronWeb = getTronWeb(network);
  const nodes = await tronWeb.trx.listNodes();
  return nodes as string[];
}

/**
 * Get detailed information about the current node
 */
export async function getNodeInfo(network = "mainnet"): Promise<Record<string, unknown>> {
  const tronWeb = getTronWeb(network);
  const info = await tronWeb.trx.getNodeInfo();
  return info as Record<string, unknown>;
}
