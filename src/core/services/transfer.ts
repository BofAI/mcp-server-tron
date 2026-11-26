import { getTronWeb } from "./clients.js";
import { getOwnerAddress, buildSignBroadcast, signTransaction } from "./agent-wallet.js";
import { parseTRC20Decimals, utils } from "./utils.js";

const TRANSFER_METADATA_TIMEOUT_MS = 2_000;

async function readTransferMetadata(
  tronWeb: ReturnType<typeof getTronWeb>,
  tokenAddress: string,
  amount: string,
  signal: AbortSignal,
) {
  const contract = await tronWeb.contract().at(tokenAddress);
  signal.throwIfAborted();
  const decimals = parseTRC20Decimals(await contract.methods.decimals().call());
  signal.throwIfAborted();
  const symbol = await contract.methods.symbol().call();
  signal.throwIfAborted();
  const formatted = (Number(BigInt(amount)) / Number(10n ** BigInt(decimals))).toString();
  return { token: { symbol, decimals }, formatted };
}

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

    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<null>((resolve) => {
      timeout = setTimeout(() => {
        controller.abort();
        resolve(null);
      }, TRANSFER_METADATA_TIMEOUT_MS);
    });
    const metadata = await Promise.race([
      readTransferMetadata(tronWeb, tokenAddress, amount, controller.signal).catch(() => null),
      deadline,
    ]).finally(() => clearTimeout(timeout));

    // A metadata failure must not turn an accepted broadcast into a failed transfer.
    return {
      txHash: txId,
      amount: { raw: amount, formatted: metadata?.formatted ?? null },
      token: metadata?.token ?? null,
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
