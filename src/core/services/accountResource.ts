import { getTronWeb, getWallet } from "./clients.js";

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

/**
 * Get the maximum amount of resources that can currently be delegated by an address.
 * Wraps TronWeb's trx.getCanDelegatedMaxSize / walletsolidity.getcandelegatedmaxsize.
 */
export async function getCanDelegatedMaxSize(
  address: string,
  resource: "BANDWIDTH" | "ENERGY",
  network = "mainnet",
) {
  const tronWeb = getTronWeb(network);

  try {
    // Prefer TronWeb helper if available
    const type = resource === "ENERGY" ? 1 : 0;
    // tronWeb.trx.getCanDelegatedMaxSize(address, resourceType)
    const res =
      typeof (tronWeb.trx as any).getCanDelegatedMaxSize === "function"
        ? await (tronWeb.trx as any).getCanDelegatedMaxSize(address, resource)
        : await tronWeb.fullNode.request(
            "wallet/getcandelegatedmaxsize",
            {
              owner_address: tronWeb.address.toHex(address),
              type,
              visible: false,
            },
            "post",
          );

    const raw = (res as any)?.max_size;
    if (raw === undefined || (typeof raw !== "number" && typeof raw !== "string")) {
      throw new Error(`Unexpected response from getCanDelegatedMaxSize: ${JSON.stringify(res)}`);
    }

    const maxSizeSun = BigInt(raw);
    return {
      address,
      resource,
      maxSizeSun,
    };
  } catch (error: any) {
    throw new Error(`Failed to get can delegated max size: ${error.message}`);
  }
}

/**
 * Get delegated resource details between two addresses under Stake 2.0.
 * Wraps TronWeb's trx.getDelegatedResourceV2 / wallet.getdelegatedresourcev2.
 */
export async function getDelegatedResourceV2(
  fromAddress: string,
  toAddress: string,
  network = "mainnet",
) {
  const tronWeb = getTronWeb(network);

  try {
    const res =
      typeof (tronWeb.trx as any).getDelegatedResourceV2 === "function"
        ? await (tronWeb.trx as any).getDelegatedResourceV2(fromAddress, toAddress, {
            confirmed: true,
          })
        : await tronWeb.fullNode.request(
            "wallet/getdelegatedresourcev2",
            {
              fromAddress: tronWeb.address.toHex(fromAddress),
              toAddress: tronWeb.address.toHex(toAddress),
              visible: false,
            },
            "post",
          );

    const delegated = (res as any)?.delegatedResource || (Array.isArray(res) ? res : []);

    // Normalize numeric fields to BigInt/string form for safety
    const normalized = (delegated as any[]).map((item) => {
      const bandwidth = (item as any).frozen_balance_for_bandwidth ?? 0;
      const energy = (item as any).frozen_balance_for_energy ?? 0;
      return {
        from: item.from || fromAddress,
        to: item.to || toAddress,
        frozenBalanceForBandwidthSun: BigInt(bandwidth).toString(),
        frozenBalanceForEnergySun: BigInt(energy).toString(),
        expireTimeForBandwidth: item.expire_time_for_bandwidth ?? 0,
        expireTimeForEnergy: item.expire_time_for_energy ?? 0,
      };
    });

    return {
      from: fromAddress,
      to: toAddress,
      delegatedResource: normalized,
      raw: res,
    };
  } catch (error: any) {
    throw new Error(`Failed to get delegated resource v2: ${error.message}`);
  }
}

/**
 * Get delegated resource account index for an address under Stake 2.0.
 * Wraps walletsolidity.getdelegatedresourceaccountindexv2.
 */
export async function getDelegatedResourceAccountIndexV2(
  address: string,
  network = "mainnet",
) {
  const tronWeb = getTronWeb(network);

  try {
    const res = await tronWeb.fullNode.request(
      "wallet/getdelegatedresourceaccountindexv2",
      {
        value: tronWeb.address.toHex(address),
        visible: false,
      },
      "post",
    );

    const account = (res as any)?.account ?? address;
    const fromAccounts = (res as any)?.fromAccounts ?? [];
    const toAccounts = (res as any)?.toAccounts ?? [];

    return {
      account,
      fromAccounts,
      toAccounts,
      raw: res,
    };
  } catch (error: any) {
    throw new Error(`Failed to get delegated resource account index v2: ${error.message}`);
  }
}


