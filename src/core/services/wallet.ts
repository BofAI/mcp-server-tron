import {
  isAgentWalletConfigured,
  getOwnerAddress,
  signMessageWithWallet,
  signTypedDataWithWallet,
} from "./agent-wallet.js";

/**
 * Check if any wallet is configured (agent-wallet or legacy env vars).
 */
export const isWalletConfigured = (): boolean => {
  return (
    isAgentWalletConfigured() ||
    !!(process.env.TRON_PRIVATE_KEY || process.env.TRON_MNEMONIC)
  );
};

/**
 * Get the address of the active wallet (works in both modes).
 */
export const getWalletAddress = getOwnerAddress;

/**
 * Sign an arbitrary message using the active wallet.
 */
export const signMessage = async (message: string): Promise<string> => {
  return signMessageWithWallet(message);
};

/**
 * Sign typed data (EIP-712) using the active wallet.
 */
export const signTypedData = async (
  domain: object,
  types: object,
  value: object,
): Promise<string> => {
  return signTypedDataWithWallet(domain, types, value);
};
