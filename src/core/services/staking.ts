import { getTronWeb } from "./clients.js";
import { getOwnerAddress, buildSignBroadcast } from "./agent-wallet.js";

/**
 * Freeze TRX to get resources (Stake 2.0)
 * @param amount Amount to freeze in Sun (decimal string to preserve precision for large values)
 * @param resource Resource type: "BANDWIDTH" or "ENERGY"
 * @param network Network name (mainnet, nile, shasta)
 * @returns Transaction hash
 */
export async function freezeBalanceV2(
  amount: string,
  resource: "BANDWIDTH" | "ENERGY" = "BANDWIDTH",
  network = "mainnet",
) {
  const tronWeb = getTronWeb(network);
  const ownerAddress = await getOwnerAddress();

  try {
    const transaction = await tronWeb.transactionBuilder.freezeBalanceV2(
      amount as any,
      resource,
      ownerAddress,
    );
    return await buildSignBroadcast(transaction as any, network);
  } catch (error: any) {
    throw new Error(`Failed to freeze balance V2: ${error.message}`);
  }
}

/**
 * Unfreeze TRX to release resources (Stake 2.0)
 * @param amount Amount to unfreeze in Sun (decimal string to preserve precision for large values)
 * @param resource Resource type: "BANDWIDTH" or "ENERGY"
 * @param network Network name (mainnet, nile, shasta)
 * @returns Transaction hash
 */
export async function unfreezeBalanceV2(
  amount: string,
  resource: "BANDWIDTH" | "ENERGY" = "BANDWIDTH",
  network = "mainnet",
) {
  const tronWeb = getTronWeb(network);
  const ownerAddress = await getOwnerAddress();

  try {
    const transaction = await tronWeb.transactionBuilder.unfreezeBalanceV2(
      amount as any,
      resource,
      ownerAddress,
    );
    return await buildSignBroadcast(transaction as any, network);
  } catch (error: any) {
    throw new Error(`Failed to unfreeze balance V2: ${error.message}`);
  }
}

/**
 * Withdraw expired unfrozen balance (Stake 2.0)
 * After the unfreezing period is over, this must be called to return TRX to available balance.
 * @param network Network name (mainnet, nile, shasta)
 * @returns Transaction hash
 */
export async function withdrawExpireUnfreeze(network = "mainnet") {
  const tronWeb = getTronWeb(network);
  const ownerAddress = await getOwnerAddress();

  try {
    const transaction = await tronWeb.transactionBuilder.withdrawExpireUnfreeze(ownerAddress);
    return await buildSignBroadcast(transaction as any, network);
  } catch (error: any) {
    throw new Error(`Failed to withdraw expire unfreeze: ${error.message}`);
  }
}

/**
 * Get remaining available unstake (unfreeze) operations for an address (Stake 2.0)
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
 * @param network Network name (mainnet, nile, shasta)
 * @returns Transaction hash
 */
export async function cancelAllUnfreezeV2(network = "mainnet") {
  const tronWeb = getTronWeb(network);
  const ownerAddress = await getOwnerAddress();

  try {
    const transaction = await (tronWeb.transactionBuilder as any).cancelAllUnfreezeV2(ownerAddress);
    return await buildSignBroadcast(transaction as any, network);
  } catch (error: any) {
    throw new Error(`Failed to cancel all unfreeze V2: ${error.message}`);
  }
}
