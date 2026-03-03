import { getWallet } from "./clients.js";

/**
 * Delegate staked resources (BANDWIDTH or ENERGY) to another address.
 * Wraps TronWeb's transactionBuilder.delegateResource.
 */
export async function delegateResource(
  privateKey: string,
  params: {
    amount: number;
    receiverAddress: string;
    resource: "BANDWIDTH" | "ENERGY";
    lock?: boolean;
    lockPeriod?: number;
  },
  network = "mainnet",
) {
  const tronWeb = getWallet(privateKey, network);

  try {
    const ownerAddress = tronWeb.defaultAddress.base58 || undefined;
    if (!ownerAddress) {
      throw new Error("Owner address is not available from wallet");
    }

    const {
      amount,
      receiverAddress,
      resource,
      lock = false,
      lockPeriod = 0,
    } = params;

    const tx = await tronWeb.transactionBuilder.delegateResource(
      amount,
      receiverAddress,
      resource,
      ownerAddress,
      lock,
      lockPeriod,
      {},
    );

    const signedTx = await tronWeb.trx.sign(tx, privateKey);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    if (result.result) {
      return result.txid;
    } else {
      throw new Error(`DelegateResource failed: ${JSON.stringify(result)}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to delegate resource: ${error.message}`);
  }
}

/**
 * Revoke delegated resources (BANDWIDTH or ENERGY) from a receiver address.
 * Wraps TronWeb's transactionBuilder.undelegateResource.
 */
export async function undelegateResource(
  privateKey: string,
  params: {
    amount: number;
    receiverAddress: string;
    resource: "BANDWIDTH" | "ENERGY";
  },
  network = "mainnet",
) {
  const tronWeb = getWallet(privateKey, network);

  try {
    const ownerAddress = tronWeb.defaultAddress.base58 || undefined;
    if (!ownerAddress) {
      throw new Error("Owner address is not available from wallet");
    }

    const { amount, receiverAddress, resource } = params;

    const tx = await tronWeb.transactionBuilder.undelegateResource(
      amount,
      receiverAddress,
      resource,
      ownerAddress,
      {},
    );

    const signedTx = await tronWeb.trx.sign(tx, privateKey);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    if (result.result) {
      return result.txid;
    } else {
      throw new Error(`UnDelegateResource failed: ${JSON.stringify(result)}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to undelegate resource: ${error.message}`);
  }
}


