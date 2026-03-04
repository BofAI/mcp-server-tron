import { getTronWeb } from "./clients.js";

// Define return types explicitly to avoid 'cannot be named' errors
type Block = any; // TronWeb block type is complex, using any for now to resolve build error

/**
 * Get block details by block number or hash
 */
export async function getBlockByNumber(blockNumber: number, network = "mainnet"): Promise<Block> {
  const tronWeb = getTronWeb(network);
  const block = await tronWeb.trx.getBlock(blockNumber);
  return block;
}

export async function getBlockByHash(blockHash: string, network = "mainnet"): Promise<Block> {
  const tronWeb = getTronWeb(network);
  const block = await tronWeb.trx.getBlock(blockHash);
  return block;
}

/**
 * Get the latest block from the network
 */
export async function getLatestBlock(network = "mainnet"): Promise<Block> {
  const tronWeb = getTronWeb(network);
  const block = await tronWeb.trx.getCurrentBlock();
  return block;
}

/**
 * Get current block number
 */
export async function getBlockNumber(network = "mainnet"): Promise<number> {
  const block = await getLatestBlock(network);
  // Type assertion or checking structure; TronWeb block structure varies slightly by version/response
  return (block as any).block_header.raw_data.number;
}

// Chain ID is not standard in TronWeb like EVM, but we can return network ID or similar
// For compatibility with tool interface
export async function getChainId(network = "mainnet"): Promise<number> {
  // Tron Mainnet ID is often considered 0x2b6653dc (hex) or similar in some contexts,
  // but typically we just return a placeholder or specific known ID if needed.
  // FullNode info might have it.

  // For now, mapping known networks to some integer IDs if needed, or just return 0
  if (network === "mainnet") return 728126428; // Tron Mainnet ID (often used)
  if (network === "nile") return 20191029; // Nile ID
  if (network === "shasta") return 1;
  return 0;
}

/**
 * Get current chain parameters (energy price, bandwidth price, etc.)
 */
export async function getChainParameters(network = "mainnet"): Promise<{
  network: string;
  energy_price_sun: number | undefined;
  bandwidth_price_sun: number | undefined;
  all_parameters: any[];
}> {
  const tronWeb = getTronWeb(network);
  const parameters = await tronWeb.trx.getChainParameters();

  const paramMap = new Map<string, number | undefined>();
  for (const param of parameters) {
    if (param.key) {
      paramMap.set(param.key, param.value);
    }
  }

  return {
    network,
    energy_price_sun: paramMap.get("getEnergyFee"),
    bandwidth_price_sun: paramMap.get("getTransactionFee"),
    all_parameters: parameters,
  };
}
