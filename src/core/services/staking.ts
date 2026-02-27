import { getWallet } from "./clients.js";

/**
 * Freeze TRX to get resources (Stake 2.0)
 * @param privateKey The private key of the account to freeze balance
 * @param amount Amount to freeze in Sun (decimal string to preserve precision for large values)
 * @param resource Resource type: "BANDWIDTH" or "ENERGY"
 * @param network Network name (mainnet, nile, shasta)
 * @returns Transaction hash
 */
export async function freezeBalanceV2(
  privateKey: string,
  amount: string,
  resource: "BANDWIDTH" | "ENERGY" = "BANDWIDTH",
  network = "mainnet",
) {
  const tronWeb = getWallet(privateKey, network);

  try {
    const transaction = await tronWeb.transactionBuilder.freezeBalanceV2(
      amount as any, // Pass string directly; TronWeb's protobuf Long handles large integers safely
      resource,
      tronWeb.defaultAddress.base58 || undefined,
    );
    const signedTx = await tronWeb.trx.sign(transaction, privateKey);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    if (result.result) {
      return result.txid;
    } else {
      throw new Error(`FreezeBalanceV2 failed: ${JSON.stringify(result)}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to freeze balance V2: ${error.message}`);
  }
}

/**
 * Unfreeze TRX to release resources (Stake 2.0)
 * @param privateKey The private key of the account to unfreeze balance
 * @param amount Amount to unfreeze in Sun (decimal string to preserve precision for large values)
 * @param resource Resource type: "BANDWIDTH" or "ENERGY"
 * @param network Network name (mainnet, nile, shasta)
 * @returns Transaction hash
 */
export async function unfreezeBalanceV2(
  privateKey: string,
  amount: string,
  resource: "BANDWIDTH" | "ENERGY" = "BANDWIDTH",
  network = "mainnet",
) {
  const tronWeb = getWallet(privateKey, network);

  try {
    const transaction = await tronWeb.transactionBuilder.unfreezeBalanceV2(
      amount as any, // Pass string directly; TronWeb's protobuf Long handles large integers safely
      resource,
      tronWeb.defaultAddress.base58 || undefined,
    );
    const signedTx = await tronWeb.trx.sign(transaction, privateKey);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    if (result.result) {
      return result.txid;
    } else {
      throw new Error(`UnfreezeBalanceV2 failed: ${JSON.stringify(result)}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to unfreeze balance V2: ${error.message}`);
  }
}

/**
 * Withdraw expired unfrozen balance (Stake 2.0)
 * After the unfreezing period is over, this must be called to return TRX to available balance.
 * @param privateKey The private key of the account
 * @param network Network name (mainnet, nile, shasta)
 * @returns Transaction hash
 */
export async function withdrawExpireUnfreeze(privateKey: string, network = "mainnet") {
  const tronWeb = getWallet(privateKey, network);

  try {
    const transaction = await tronWeb.transactionBuilder.withdrawExpireUnfreeze(
      tronWeb.defaultAddress.base58 || undefined,
    );
    const signedTx = await tronWeb.trx.sign(transaction, privateKey);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    if (result.result) {
      return result.txid;
    } else {
      throw new Error(`WithdrawExpireUnfreeze failed: ${JSON.stringify(result)}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to withdraw expire unfreeze: ${error.message}`);
  }
}
