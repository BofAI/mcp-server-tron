import { getTronWeb } from "./clients.js";
import { getOwnerAddress, buildSignBroadcast, signTransaction } from "./agent-wallet.js";
import { utils } from "./utils.js";

/**
 * Transfer TRX to an address
 */
export async function transferTRX(
  to: string,
  amount: string, // Amount in TRX (not Sun)
  network = "mainnet",
) {
  const tronWeb = getTronWeb(network);
  const ownerAddress = await getOwnerAddress();
  const amountSun = utils.toSun(amount as any);

  const unsignedTx = await tronWeb.transactionBuilder.sendTrx(to, amountSun as any, ownerAddress);
  return await buildSignBroadcast(unsignedTx as any, network);
}

/**
 * Transfer TRC20 tokens
 */
export async function transferTRC20(
  tokenAddress: string,
  to: string,
  amount: string, // Raw amount (accounting for decimals)
  network = "mainnet",
) {
  const tronWeb = getTronWeb(network);
  const ownerAddress = await getOwnerAddress();

  try {
    // Build unsigned tx via triggerSmartContract
    const functionSelector = "transfer(address,uint256)";
    const parameter = [
      { type: "address", value: to },
      { type: "uint256", value: amount },
    ];
    const { transaction, result: triggerResult } =
      await tronWeb.transactionBuilder.triggerSmartContract(
        tokenAddress,
        functionSelector,
        {},
        parameter,
        ownerAddress,
      );

    if (!triggerResult || !triggerResult.result) {
      throw new Error(
        `Failed to build TRC20 transfer transaction: ${JSON.stringify(triggerResult)}`,
      );
    }

    const signedTx = await signTransaction(transaction as any);
    const broadcastResult = await tronWeb.trx.sendRawTransaction(signedTx as any);

    if (!broadcastResult.result) {
      throw new Error(`Broadcast failed: ${JSON.stringify(broadcastResult)}`);
    }

    const txId = broadcastResult.txid || (transaction as any).txID;

    // Fetch token info for return (using read-only client)
    const contract = await tronWeb.contract().at(tokenAddress);
    const symbol = await contract.methods.symbol().call();
    const decimals = await contract.methods.decimals().call();

    const decimalsNum = Number(decimals);
    const divisor = BigInt(10) ** BigInt(decimalsNum);
    const formatted = (Number(BigInt(amount)) / Number(divisor)).toString();

    return {
      txHash: txId,
      amount: {
        raw: amount,
        formatted: formatted,
      },
      token: {
        symbol: symbol,
        decimals: decimalsNum,
      },
    };
  } catch (error: any) {
    throw new Error(`Failed to transfer TRC20: ${error.message}`);
  }
}

/**
 * Approve token spending
 */
export async function approveTRC20(
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  network = "mainnet",
) {
  const tronWeb = getTronWeb(network);
  const ownerAddress = await getOwnerAddress();

  try {
    const functionSelector = "approve(address,uint256)";
    const parameter = [
      { type: "address", value: spenderAddress },
      { type: "uint256", value: amount },
    ];
    const { transaction, result: triggerResult } =
      await tronWeb.transactionBuilder.triggerSmartContract(
        tokenAddress,
        functionSelector,
        {},
        parameter,
        ownerAddress,
      );

    if (!triggerResult || !triggerResult.result) {
      throw new Error(
        `Failed to build TRC20 approve transaction: ${JSON.stringify(triggerResult)}`,
      );
    }

    return await buildSignBroadcast(transaction as any, network);
  } catch (error: any) {
    throw new Error(`Failed to approve TRC20: ${error.message}`);
  }
}
