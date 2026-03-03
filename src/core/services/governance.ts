import { getTronWeb, getWallet } from "./clients.js";

// ============================================================================
// WITNESS / SUPER REPRESENTATIVE READ OPERATIONS
// ============================================================================

/**
 * List all Super Representatives (witnesses)
 * @param network Network name (mainnet, nile, shasta)
 */
export async function listWitnesses(network = "mainnet") {
  const tronWeb = getTronWeb(network);
  try {
    // TronWeb exposes this as listSuperRepresentatives
    const witnesses = await (tronWeb.trx as any).listSuperRepresentatives();
    return witnesses;
  } catch (error: any) {
    throw new Error(`Failed to list witnesses: ${error.message}`);
  }
}

/**
 * Get paginated list of current Super Representatives
 * Uses TronWeb listSuperRepresentatives with manual pagination since
 * the raw paginated API is not available on all networks.
 * @param offset Starting offset for pagination
 * @param limit Number of results per page
 * @param network Network name
 */
export async function getPaginatedWitnessList(
  offset: number = 0,
  limit: number = 20,
  network = "mainnet",
) {
  const tronWeb = getTronWeb(network);
  try {
    const allWitnesses = await (tronWeb.trx as any).listSuperRepresentatives();
    const paged = allWitnesses.slice(offset, offset + limit);
    return {
      witnesses: paged,
      total: allWitnesses.length,
      offset,
      limit,
    };
  } catch (error: any) {
    throw new Error(`Failed to get paginated witness list: ${error.message}`);
  }
}

/**
 * Get the time (in seconds) until the next network maintenance / vote cycle
 * @param network Network name
 */
export async function getNextMaintenanceTime(network = "mainnet") {
  const tronWeb = getTronWeb(network);
  try {
    // timeUntilNextVoteCycle returns seconds until next maintenance
    const secondsUntil = await tronWeb.trx.timeUntilNextVoteCycle();
    const nextMaintenanceTimestamp = Date.now() + secondsUntil * 1000;
    return {
      secondsUntilNextMaintenance: secondsUntil,
      nextMaintenanceTimestamp,
      nextMaintenanceDate: new Date(nextMaintenanceTimestamp).toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Failed to get next maintenance time: ${error.message}`);
  }
}

/**
 * Get the current unclaimed voting reward for an address
 * @param address The address to query reward for
 * @param network Network name
 */
export async function getReward(address: string, network = "mainnet") {
  const tronWeb = getTronWeb(network);
  try {
    const reward = await tronWeb.trx.getReward(address);
    return reward;
  } catch (error: any) {
    throw new Error(`Failed to get reward: ${error.message}`);
  }
}

/**
 * Get the brokerage ratio (SR dividend ratio) for a witness address
 * @param witnessAddress The SR witness address
 * @param network Network name
 */
export async function getBrokerage(witnessAddress: string, network = "mainnet") {
  const tronWeb = getTronWeb(network);
  try {
    const brokerage = await tronWeb.trx.getBrokerage(witnessAddress);
    return brokerage;
  } catch (error: any) {
    throw new Error(`Failed to get brokerage: ${error.message}`);
  }
}

// ============================================================================
// WITNESS / SUPER REPRESENTATIVE WRITE OPERATIONS
// ============================================================================

/**
 * Apply to become a Super Representative (witness)
 * @param privateKey The private key of the applicant
 * @param url The official website URL of the SR candidate
 * @param network Network name
 * @returns Transaction hash
 */
export async function createWitness(
  privateKey: string,
  url: string,
  network = "mainnet",
): Promise<string> {
  const tronWeb = getWallet(privateKey, network);
  try {
    const address = tronWeb.defaultAddress.base58 || undefined;
    const transaction = await tronWeb.transactionBuilder.applyForSR(address as any, url);
    const signedTx = await tronWeb.trx.sign(transaction, privateKey);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    if (result.result) {
      return result.txid;
    } else {
      throw new Error(`CreateWitness failed: ${JSON.stringify(result)}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to create witness (apply for SR): ${error.message}`);
  }
}

/**
 * Update SR node URL via raw API (TronWeb TransactionBuilder does not expose updateWitness)
 * @param privateKey The private key of the SR
 * @param url The new official website URL
 * @param network Network name
 * @returns Transaction hash
 */
export async function updateWitness(
  privateKey: string,
  url: string,
  network = "mainnet",
): Promise<string> {
  const tronWeb = getWallet(privateKey, network);
  try {
    const ownerAddress = tronWeb.defaultAddress.hex;
    if (!ownerAddress) {
      throw new Error("No owner address configured");
    }

    // Build the WitnessUpdateContract via raw API since TronWeb SDK doesn't wrap it
    const transaction = await (tronWeb as any).fullNode.request(
      "wallet/updatewitness",
      {
        owner_address: ownerAddress,
        update_url: Buffer.from(url).toString("hex"),
      },
      "post",
    );

    if (!transaction || transaction.Error) {
      throw new Error(
        `Failed to build updateWitness transaction: ${transaction?.Error || "unknown error"}`,
      );
    }

    // Use internal crypto.signTransaction to bypass txCheck, which does not support
    // WitnessUpdateContract in the txJsonToPb mapping (causes "getRawData" error).
    const signedTx = (tronWeb as any).utils.crypto.signTransaction(privateKey, transaction);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    if (result.result) {
      return result.txid;
    } else {
      throw new Error(`UpdateWitness failed: ${JSON.stringify(result)}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to update witness: ${error.message}`);
  }
}

/**
 * Vote for Super Representatives
 * Requires the voter to have frozen TRX (Stake 2.0) to obtain TRON Power.
 * @param privateKey The private key of the voter
 * @param votes Array of { address, voteCount } objects
 * @param network Network name
 * @returns Transaction hash
 */
export async function voteWitness(
  privateKey: string,
  votes: Array<{ address: string; voteCount: number }>,
  network = "mainnet",
): Promise<string> {
  const tronWeb = getWallet(privateKey, network);
  try {
    const ownerAddress = tronWeb.defaultAddress.base58 || undefined;
    // TronWeb vote() expects an object { srAddress: voteCount, ... }
    const voteMap: Record<string, number> = {};
    for (const v of votes) {
      voteMap[v.address] = v.voteCount;
    }
    const transaction = await tronWeb.transactionBuilder.vote(voteMap as any, ownerAddress as any);
    const signedTx = await tronWeb.trx.sign(transaction, privateKey);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    if (result.result) {
      return result.txid;
    } else {
      throw new Error(`VoteWitness failed: ${JSON.stringify(result)}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to vote for witness: ${error.message}`);
  }
}

/**
 * Withdraw voting reward balance to the account
 * @param privateKey The private key of the account
 * @param network Network name
 * @returns Transaction hash
 */
export async function withdrawBalance(privateKey: string, network = "mainnet"): Promise<string> {
  const tronWeb = getWallet(privateKey, network);
  try {
    const address = tronWeb.defaultAddress.base58 || undefined;
    const transaction = await tronWeb.transactionBuilder.withdrawBlockRewards(address as any);
    const signedTx = await tronWeb.trx.sign(transaction, privateKey);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    if (result.result) {
      return result.txid;
    } else {
      throw new Error(`WithdrawBalance failed: ${JSON.stringify(result)}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to withdraw balance: ${error.message}`);
  }
}

/**
 * Update the SR brokerage ratio (dividend ratio for voters)
 * @param privateKey The private key of the SR
 * @param brokerage Brokerage percentage (0-100). E.g. 20 means SR keeps 20%, voters get 80%.
 * @param network Network name
 * @returns Transaction hash
 */
export async function updateBrokerage(
  privateKey: string,
  brokerage: number,
  network = "mainnet",
): Promise<string> {
  const tronWeb = getWallet(privateKey, network);
  try {
    const address = tronWeb.defaultAddress.base58 || undefined;
    const transaction = await tronWeb.transactionBuilder.updateBrokerage(brokerage, address as any);
    const signedTx = await tronWeb.trx.sign(transaction, privateKey);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    if (result.result) {
      return result.txid;
    } else {
      throw new Error(`UpdateBrokerage failed: ${JSON.stringify(result)}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to update brokerage: ${error.message}`);
  }
}
