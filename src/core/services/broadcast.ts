import { getTronWeb } from "./clients.js";

/**
 * Broadcast a signed transaction to the network (BroadcastTransaction)
 */
export async function broadcastTransaction(
  transaction: Record<string, unknown>,
  network = "mainnet",
): Promise<any> {
  const tronWeb = getTronWeb(network);
  return tronWeb.trx.sendRawTransaction(transaction as any);
}

/**
 * Broadcast a signed transaction in hex format (BroadcastHex)
 */
export async function broadcastHex(transaction: string, network = "mainnet"): Promise<any> {
  const tronWeb = getTronWeb(network);
  return tronWeb.trx.sendHexTransaction(transaction);
}

/**
 * Create a TRX transfer transaction (CreateTransaction)
 * Returns an unsigned transaction object.
 */
export async function createTransaction(
  ownerAddress: string,
  toAddress: string,
  amount: number,
  network = "mainnet",
): Promise<any> {
  const tronWeb = getTronWeb(network);
  return tronWeb.transactionBuilder.sendTrx(toAddress, amount, ownerAddress);
}
