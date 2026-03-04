import { getTronWeb, getWallet } from "./clients.js";

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

/**
 * Get remaining available unstake (unfreeze) operations for an address (Stake 2.0)
 * Uses /wallet/getavailableunfreezecount under the hood.
 * @param address Wallet address (Base58 or hex)
 * @param network Network name (mainnet, nile, shasta)
 * @returns Remaining count of available unstake operations
 */
export async function getAvailableUnfreezeCount(address: string, network = "mainnet") {
  const tronWeb = getTronWeb(network);

  try {
    const ownerAddress = tronWeb.address.toHex(address);
    const res = await tronWeb.fullNode.request(
      "wallet/getavailableunfreezecount",
      { owner_address: ownerAddress },
      "post",
    );

    if (typeof (res as any)?.count !== "number") {
      throw new Error(`Unexpected response from getavailableunfreezecount: ${JSON.stringify(res)}`);
    }

    return (res as any).count;
  } catch (error: any) {
    throw new Error(`Failed to get available unfreeze count: ${error.message}`);
  }
}

/**
 * Get withdrawable unstaked amount for an address at a given timestamp (Stake 2.0)
 * Uses /wallet/getcanwithdrawunfreezeamount under the hood.
 * @param address Wallet address (Base58 or hex)
 * @param network Network name (mainnet, nile, shasta)
 * @param timestampMs Optional query timestamp in milliseconds. Defaults to current time.
 * @returns Object containing withdrawable amount in Sun and the timestamp used
 */
export async function getCanWithdrawUnfreezeAmount(
  address: string,
  network = "mainnet",
  timestampMs?: number,
) {
  const tronWeb = getTronWeb(network);

  try {
    const ownerAddress = tronWeb.address.toHex(address);
    const ts = timestampMs ?? Date.now();

    const res = await tronWeb.fullNode.request(
      "wallet/getcanwithdrawunfreezeamount",
      {
        owner_address: ownerAddress,
        timestamp: ts,
      },
      "post",
    );

    const rawAmount = (res as any)?.amount;
    if (rawAmount === undefined || (typeof rawAmount !== "number" && typeof rawAmount !== "string")) {
      throw new Error(
        `Unexpected response from getcanwithdrawunfreezeamount: ${JSON.stringify(res)}`,
      );
    }

    const amountSun = BigInt(rawAmount);
    return { amountSun, timestampMs: ts };
  } catch (error: any) {
    throw new Error(`Failed to get can withdraw unfreeze amount: ${error.message}`);
  }
}

/**
 * Cancel all unfreeze operations (Stake 2.0)
 * This will:
 * - Re-stake all unfreezing amounts still in the waiting period
 * - Automatically withdraw all amounts whose unfreezing period has already expired
 * @param privateKey The private key of the account
 * @param network Network name (mainnet, nile, shasta)
 * @returns Transaction hash
 */
export async function cancelAllUnfreezeV2(privateKey: string, network = "mainnet") {
  const tronWeb = getWallet(privateKey, network);

  try {
    const transaction = await (tronWeb.transactionBuilder as any).cancelAllUnfreezeV2(
      tronWeb.defaultAddress.base58 || undefined,
    );
    const signedTx = await tronWeb.trx.sign(transaction, privateKey);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    if (result.result) {
      return result.txid;
    } else {
      throw new Error(`CancelAllUnfreezeV2 failed: ${JSON.stringify(result)}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to cancel all unfreeze V2: ${error.message}`);
  }
}
