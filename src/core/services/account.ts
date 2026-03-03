import { TronWeb } from "tronweb";
import { getTronWeb, getWallet } from "./clients.js";

/**
 * Get full account information from the TRON network
 * @param address Account address (Base58 or Hex)
 * @param network Network name
 * @returns Full account object including balance, resources, permissions, etc.
 */
export async function getAccount(address: string, network = "mainnet"): Promise<any> {
  const tronWeb = getTronWeb(network);
  try {
    const account = await tronWeb.trx.getAccount(address);
    return account;
  } catch (error: any) {
    throw new Error(`Failed to get account: ${error.message}`);
  }
}

/**
 * Get account balance at a specific block
 * TronWeb does not wrap this API, so we call the fullNode HTTP endpoint directly.
 * @param address Account address
 * @param blockHash Block hash
 * @param blockNumber Block number
 * @param network Network name
 */
export async function getAccountBalance(
  address: string,
  blockHash: string,
  blockNumber: number,
  network = "mainnet",
) {
  const tronWeb = getTronWeb(network);
  try {
    const result = await tronWeb.fullNode.request<{ balance?: number; block_identifier?: any }>(
      "/wallet/getaccountbalance",
      {
        account_identifier: { address },
        block_identifier: { hash: blockHash, number: blockNumber },
        visible: true,
      },
      "post",
    );
    return result;
  } catch (error: any) {
    throw new Error(`Failed to get account balance: ${error.message}`);
  }
}

/**
 * Generate a new account offline (keypair generation, no network interaction)
 * @returns Object with privateKey, publicKey, and address (base58 + hex)
 */
export async function generateAccount() {
  try {
    const account = await TronWeb.createAccount();
    return account;
  } catch (error: any) {
    throw new Error(`Failed to generate account: ${error.message}`);
  }
}

/**
 * Validate a TRON address
 * @param address Address to validate
 * @returns Validation result with format information
 */
export function validateAddress(address: string) {
  const isValid = TronWeb.isAddress(address);
  const isBase58 = typeof address === "string" && address.startsWith("T") && address.length === 34;
  const isHex =
    typeof address === "string" && (address.startsWith("41") || address.startsWith("0x"));

  return {
    isValid,
    address,
    format: isBase58 ? "base58" : isHex ? "hex" : "unknown",
  };
}

/**
 * Get bandwidth information for an account
 * @param address Account address
 * @param network Network name
 * @returns Bandwidth (net) value
 */
export async function getAccountNet(address: string, network = "mainnet") {
  const tronWeb = getTronWeb(network);
  try {
    const bandwidth = await tronWeb.trx.getBandwidth(address);
    return { address, bandwidth };
  } catch (error: any) {
    throw new Error(`Failed to get account net: ${error.message}`);
  }
}

/**
 * Get account resource information (energy, bandwidth, etc.)
 * @param address Account address
 * @param network Network name
 * @returns Account resources including energy limit, bandwidth, frozen balance, etc.
 */
export async function getAccountResource(address: string, network = "mainnet"): Promise<any> {
  const tronWeb = getTronWeb(network);
  try {
    const resources = await tronWeb.trx.getAccountResources(address);
    return resources;
  } catch (error: any) {
    throw new Error(`Failed to get account resource: ${error.message}`);
  }
}

/**
 * Get delegated resource details between two accounts (Stake 2.0)
 * @param fromAddress Delegator address
 * @param toAddress Recipient address
 * @param network Network name
 */
export async function getDelegatedResource(
  fromAddress: string,
  toAddress: string,
  network = "mainnet",
) {
  const tronWeb = getTronWeb(network);
  try {
    const result = await tronWeb.trx.getDelegatedResourceV2(fromAddress, toAddress);
    return result;
  } catch (error: any) {
    throw new Error(`Failed to get delegated resource: ${error.message}`);
  }
}

/**
 * Get the delegation index for an account (who delegated to whom)
 * @param address Account address
 * @param network Network name
 * @returns Delegation index with fromAccounts and toAccounts lists
 */
export async function getDelegatedResourceIndex(address: string, network = "mainnet") {
  const tronWeb = getTronWeb(network);
  try {
    const result = await tronWeb.trx.getDelegatedResourceAccountIndexV2(address);
    return result;
  } catch (error: any) {
    throw new Error(`Failed to get delegated resource index: ${error.message}`);
  }
}

/**
 * Activate a new account on the TRON network (costs bandwidth from the creator)
 * @param privateKey Creator's private key
 * @param newAddress Address to activate
 * @param network Network name
 * @returns Transaction hash
 */
export async function createAccount(privateKey: string, newAddress: string, network = "mainnet") {
  const tronWeb = getWallet(privateKey, network);

  try {
    const transaction = await tronWeb.transactionBuilder.createAccount(
      newAddress,
      tronWeb.defaultAddress.base58 || undefined,
    );
    const signedTx = await tronWeb.trx.sign(transaction, privateKey);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    if (result.result) {
      return result.txid;
    } else {
      throw new Error(`CreateAccount failed: ${JSON.stringify(result)}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to create account: ${error.message}`);
  }
}

/**
 * Update account name (can only be set once)
 * @param privateKey Account's private key
 * @param accountName New account name
 * @param network Network name
 * @returns Transaction hash
 */
export async function updateAccount(privateKey: string, accountName: string, network = "mainnet") {
  const tronWeb = getWallet(privateKey, network);

  try {
    const transaction = await tronWeb.transactionBuilder.updateAccount(
      accountName,
      tronWeb.defaultAddress.base58 || undefined,
    );
    const signedTx = await tronWeb.trx.sign(transaction, privateKey);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    if (result.result) {
      return result.txid;
    } else {
      throw new Error(`UpdateAccount failed: ${JSON.stringify(result)}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to update account: ${error.message}`);
  }
}

/**
 * Update account permissions (multi-signature configuration)
 * @param privateKey Account's private key
 * @param ownerPermission Owner permission configuration
 * @param activePermissions Active permission(s) configuration
 * @param witnessPermission Optional witness permission (for Super Representatives)
 * @param network Network name
 * @returns Transaction hash
 */
export async function updateAccountPermissions(
  privateKey: string,
  ownerPermission: {
    type: number;
    permission_name: string;
    threshold: number;
    keys: { address: string; weight: number }[];
  },
  activePermissions:
    | {
        type: number;
        permission_name: string;
        threshold: number;
        operations: string;
        keys: { address: string; weight: number }[];
      }
    | {
        type: number;
        permission_name: string;
        threshold: number;
        operations: string;
        keys: { address: string; weight: number }[];
      }[],
  witnessPermission:
    | {
        type: number;
        permission_name: string;
        threshold: number;
        keys: { address: string; weight: number }[];
      }
    | null
    | undefined,
  network = "mainnet",
) {
  const tronWeb = getWallet(privateKey, network);

  try {
    const transaction = await tronWeb.transactionBuilder.updateAccountPermissions(
      tronWeb.defaultAddress.base58 || undefined,
      ownerPermission as any,
      witnessPermission as any,
      activePermissions as any,
    );
    const signedTx = await tronWeb.trx.sign(transaction, privateKey);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    if (result.result) {
      return result.txid;
    } else {
      throw new Error(`AccountPermissionUpdate failed: ${JSON.stringify(result)}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to update account permissions: ${error.message}`);
  }
}
