import { getTronWeb } from "./clients.js";

/**
 * Get the latest N blocks (GetBlockByLatestNum)
 */
export async function getBlockByLatestNum(num: number, network = "mainnet"): Promise<any> {
  const tronWeb = getTronWeb(network);
  return tronWeb.fullNode.request("wallet/getblockbylatestnum", { num }, "post");
}

/**
 * Get blocks in a range [startNum, endNum) (GetBlockByLimitNext)
 * Note: TronWeb's getBlockRange(start, end) wraps this endpoint but adjusts endNum internally.
 * We call fullNode.request directly to match the raw FullNode API semantics.
 */
export async function getBlockByLimitNext(
  startNum: number,
  endNum: number,
  network = "mainnet",
): Promise<any> {
  const tronWeb = getTronWeb(network);
  return tronWeb.fullNode.request("wallet/getblockbylimitnext", { startNum, endNum }, "post");
}

/**
 * Get all balance change operations in a block (GetBlockBalance)
 */
export async function getBlockBalance(
  hash: string,
  number: number,
  network = "mainnet",
): Promise<any> {
  const tronWeb = getTronWeb(network);
  return tronWeb.fullNode.request(
    "wallet/getblockbalance",
    { hash, number, visible: true },
    "post",
  );
}

/**
 * Get TransactionInfo for all transactions in a specific block (GetTransactionInfoByBlockNum)
 */
export async function getTransactionInfoByBlockNum(num: number, network = "mainnet"): Promise<any> {
  const tronWeb = getTronWeb(network);
  return tronWeb.fullNode.request("wallet/gettransactioninfobyblocknum", { num }, "post");
}

/**
 * Get the list of accounts that have signed a transaction (GetApprovedList)
 */
export async function getApprovedList(
  transaction: Record<string, unknown>,
  network = "mainnet",
): Promise<any> {
  const tronWeb = getTronWeb(network);
  return tronWeb.trx.getApprovedList(transaction as any);
}

/**
 * Get historical energy unit price (GetEnergyPrices)
 */
export async function getEnergyPrices(network = "mainnet"): Promise<any> {
  const tronWeb = getTronWeb(network);
  return tronWeb.trx.getEnergyPrices();
}

/**
 * Get historical bandwidth unit price (GetBandwidthPrices)
 */
export async function getBandwidthPrices(network = "mainnet"): Promise<any> {
  const tronWeb = getTronWeb(network);
  return tronWeb.trx.getBandwidthPrices();
}

/**
 * Get the amount of TRX burned from on-chain transaction fees (GetBurnTRX)
 */
export async function getBurnTrx(network = "mainnet"): Promise<any> {
  const tronWeb = getTronWeb(network);
  return tronWeb.fullNode.request("wallet/getburntrx", {}, "post");
}
