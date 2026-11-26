import { getTronWeb } from "./clients.js";
import { parseTRC20Decimals, utils } from "./utils.js";

/**
 * Get TRX balance for an address
 */
export async function getTRXBalance(address: string, network = "mainnet") {
  const tronWeb = getTronWeb(network);
  const balanceSun = await tronWeb.trx.getBalance(address);

  return {
    wei: BigInt(balanceSun), // Keeping 'wei' property name for compatibility if tools rely on it, but strictly it's Sun
    ether: utils.fromSun(balanceSun), // 'ether' -> TRX
    formatted: utils.fromSun(balanceSun),
    symbol: "TRX",
    decimals: 6,
  };
}

/**
 * Get TRC20 token balance
 */
export async function getTRC20Balance(
  tokenAddress: string,
  walletAddress: string,
  network = "mainnet",
) {
  const tronWeb = getTronWeb(network);

  try {
    const contract = await tronWeb.contract().at(tokenAddress);
    // TRC20 standard functions
    const balance = await contract.methods.balanceOf(walletAddress).call();
    const decimals = parseTRC20Decimals(await contract.methods.decimals().call());
    const symbol = await contract.methods.symbol().call();

    const balanceBigInt = BigInt(balance.toString());
    const divisor = BigInt(10) ** BigInt(decimals);

    // Basic formatting
    const formatted = (Number(balanceBigInt) / Number(divisor)).toString();

    return {
      raw: balanceBigInt,
      formatted: formatted,
      token: {
        symbol: symbol,
        decimals,
        address: tokenAddress,
      },
    };
  } catch (error: any) {
    throw new Error(`Failed to get TRC20 balance: ${error.message}`);
  }
}

/**
 * Get TRC1155 balance
 */
export async function getTRC1155Balance(
  contractAddress: string,
  ownerAddress: string,
  tokenId: bigint,
  network = "mainnet",
) {
  const tronWeb = getTronWeb(network);

  try {
    const contract = await tronWeb.contract().at(contractAddress);
    const balance = await contract.methods.balanceOf(ownerAddress, tokenId.toString()).call();
    return BigInt(balance.toString());
  } catch (error: any) {
    throw new Error(`Failed to get TRC1155 balance: ${error.message}`);
  }
}
