import { TronWeb } from "tronweb";
import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { HDKey } from "@scure/bip32";

/**
 * Get the configured account from environment (private key or mnemonic)
 *
 * Configuration options:
 * - TRON_PRIVATE_KEY: Hex private key (with or without 0x prefix)
 * - TRON_MNEMONIC: BIP-39 mnemonic phrase (12 or 24 words)
 * - TRON_ACCOUNT_INDEX: Optional account index for HD wallet derivation (default: 0)
 */

export interface ConfiguredWallet {
  privateKey: string;
  address: string;
}

/**
 * Check if a wallet is configured via environment variables
 */
export const isWalletConfigured = (): boolean => {
  return !!(process.env.TRON_PRIVATE_KEY || process.env.TRON_MNEMONIC);
};

export const getConfiguredWallet = (): ConfiguredWallet => {
  const privateKey = process.env.TRON_PRIVATE_KEY;
  const mnemonic = process.env.TRON_MNEMONIC;
  const accountIndexStr = process.env.TRON_ACCOUNT_INDEX || "0";
  const accountIndex = parseInt(accountIndexStr, 10);

  // Validate account index
  if (isNaN(accountIndex) || accountIndex < 0 || !Number.isInteger(accountIndex)) {
    throw new Error(
      `Invalid TRON_ACCOUNT_INDEX: "${accountIndexStr}". Must be a non-negative integer.`,
    );
  }

  if (privateKey) {
    // Use private key if provided
    // TronWeb handles private keys without 0x prefix usually.
    // If it has 0x, we strip it to be safe for TronWeb usage.
    const cleanKey = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
    const address = TronWeb.address.fromPrivateKey(cleanKey);

    if (!address) {
      throw new Error("Invalid private key provided in TRON_PRIVATE_KEY");
    }

    return {
      privateKey: cleanKey,
      address: address,
    };
  } else if (mnemonic) {
    // Derive from mnemonic
    if (!bip39.validateMnemonic(mnemonic, wordlist)) {
      throw new Error("Invalid mnemonic provided in TRON_MNEMONIC");
    }

    // Tron derivation path: m/44'/195'/0'/0/index
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const hdKey = HDKey.fromMasterSeed(seed);
    const child = hdKey.derive(`m/44'/195'/0'/0/${accountIndex}`);

    if (!child.privateKey) {
      throw new Error("Failed to derive private key from mnemonic");
    }

    const privateKeyHex = Buffer.from(child.privateKey).toString("hex");
    const address = TronWeb.address.fromPrivateKey(privateKeyHex);

    return {
      privateKey: privateKeyHex,
      address: address as string, // TronWeb returns false or string
    };
  } else {
    throw new Error(
      "Neither TRON_PRIVATE_KEY nor TRON_MNEMONIC environment variable is set. " +
        "Configure one of them to enable write operations.\n" +
        "- TRON_PRIVATE_KEY: Your private key in hex format\n" +
        "- TRON_MNEMONIC: Your 12 or 24 word mnemonic phrase\n" +
        "- TRON_ACCOUNT_INDEX: (Optional) Account index for HD wallet (default: 0)",
    );
  }
};

/**
 * Helper to get the configured private key (for services that need it)
 */
export const getConfiguredPrivateKey = (): string => {
  const wallet = getConfiguredWallet();
  return wallet.privateKey;
};

/**
 * Helper to get wallet address
 */
export const getWalletAddressFromKey = (): string => {
  const wallet = getConfiguredWallet();
  return wallet.address;
};

/**
 * Sign an arbitrary message using the configured wallet
 * @param message The message to sign (can be a string or hex data)
 * @returns The signature as a hex string
 */
export const signMessage = async (message: string): Promise<string> => {
  const { privateKey } = getConfiguredWallet();
  const apiKey = process.env.TRONGRID_API_KEY;

  // Create a temporary TronWeb instance for signing (network doesn't matter for pure signing usually, but good practice)
  // Actually we can use TronWeb.Trx.signString equivalent if available statically, or instance.
  const tronWeb = new TronWeb({
    fullHost: "https://api.trongrid.io", // Dummy host for signing
    privateKey: privateKey,
    headers: apiKey ? { "TRON-PRO-API-KEY": apiKey } : undefined,
  });

  // Sign the message
  // Note: TronWeb signing usually prefixes with standard Tron message prefix
  const signature = await tronWeb.trx.sign(message);

  return signature;
};

/**
 * Sign typed data (EIP-712 equivalent in Tron / TRON-712)
 * Note: Tron support for EIP-712 is limited/specific.
 * This implementation assumes standard EIP-712 compatible signing if supported by TronWeb version.
 */
export const signTypedData = async (
  domain: object,
  types: object,
  value: object,
): Promise<string> => {
  const { privateKey } = getConfiguredWallet();
  const apiKey = process.env.TRONGRID_API_KEY;

  // TronWeb might support _signTypedData or similar.
  // For now, we'll use a generic implementation if TronWeb exposes it,
  // otherwise we might need to construct the hash manually or use a specific library.

  // Checking TronWeb docs, it supports signTypedData since recently.
  const tronWeb = new TronWeb({
    fullHost: "https://api.trongrid.io",
    privateKey: privateKey,
    headers: apiKey ? { "TRON-PRO-API-KEY": apiKey } : undefined,
  });

  // @ts-ignore - TronWeb types might be missing signTypedData
  if (typeof tronWeb.trx._signTypedData === "function") {
    // @ts-ignore
    return await tronWeb.trx._signTypedData(domain, types, value);
  }

  throw new Error("signTypedData not supported by this TronWeb version or configuration");
};
