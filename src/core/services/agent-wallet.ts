/**
 * Agent-wallet integration layer for mcp-server-tron.
 *
 * Provides a unified signing interface that supports two modes:
 * - **agent-wallet mode**: Keys encrypted at rest via Keystore V3, signing via agent-wallet SDK
 * - **legacy mode**: Private key from TRON_PRIVATE_KEY / TRON_MNEMONIC env vars
 *
 * Priority: agent-wallet env vars take precedence over legacy env vars.
 */

import {
  WalletFactory,
  type WalletProvider,
  type BaseWallet,
  type Eip712Capable,
  type WalletInfo,
  SecureKVStore,
  TronWallet,
  loadConfig,
  saveConfig,
} from "@bankofai/agent-wallet";
import { TronWeb } from "tronweb";
import { getTronWeb, getWallet } from "./clients.js";

// ---------------------------------------------------------------------------
// Module-level singleton state
// ---------------------------------------------------------------------------

let provider: WalletProvider | null = null;
let activeWallet: BaseWallet | null = null;
let activeAddress: string | null = null;
let activeWalletId: string | null = null;

// ---------------------------------------------------------------------------
// Mode detection
// ---------------------------------------------------------------------------

/** True when agent-wallet env vars are configured. */
export function isAgentWalletConfigured(): boolean {
  return !!(
    process.env.AGENT_WALLET_DIR &&
    process.env.AGENT_WALLET_PASSWORD
  );
}

/** True when legacy TRON_PRIVATE_KEY / TRON_MNEMONIC env vars are set. */
export function isLegacyMode(): boolean {
  if (isAgentWalletConfigured()) return false;
  return !!(process.env.TRON_PRIVATE_KEY || process.env.TRON_MNEMONIC);
}

// ---------------------------------------------------------------------------
// Provider initialization (lazy)
// ---------------------------------------------------------------------------

function getProvider(): WalletProvider {
  if (provider) return provider;

  const secretsDir = process.env.AGENT_WALLET_DIR!;
  const password = process.env.AGENT_WALLET_PASSWORD!;

  provider = WalletFactory({ secretsDir, password });
  return provider;
}

// ---------------------------------------------------------------------------
// Active wallet management
// ---------------------------------------------------------------------------

/**
 * Get the currently active agent-wallet. Lazily initializes provider and
 * selects the wallet specified by AGENT_WALLET_ID (or first tron wallet).
 */
export async function getActiveWallet(): Promise<BaseWallet> {
  if (activeWallet) return activeWallet;

  const p = getProvider();

  let walletId = activeWalletId || process.env.AGENT_WALLET_ID;
  if (!walletId) {
    // Auto-select first available wallet
    const wallets = await p.listWallets();
    if (wallets.length === 0) {
      throw new Error(
        "No wallets found in agent-wallet. Use generate_account to create one, " +
          "or set AGENT_WALLET_ID to a specific wallet.",
      );
    }
    walletId = wallets[0].id;
  }

  activeWallet = await p.getWallet(walletId);
  activeWalletId = walletId;
  activeAddress = await activeWallet.getAddress();
  return activeWallet;
}

/**
 * Get the address of the active wallet. Works in both agent-wallet and legacy modes.
 */
export async function getOwnerAddress(): Promise<string> {
  if (isLegacyMode()) {
    // Legacy: derive address from env-var private key
    const privateKey = getLegacyPrivateKey();
    const cleanKey = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
    return TronWeb.address.fromPrivateKey(cleanKey) as string;
  }

  if (activeAddress) return activeAddress;
  const wallet = await getActiveWallet();
  activeAddress = await wallet.getAddress();
  return activeAddress;
}

/**
 * Switch the active wallet at runtime (agent-wallet mode only).
 */
export async function selectWallet(
  walletId: string,
): Promise<{ id: string; address: string }> {
  if (isLegacyMode()) {
    throw new Error(
      "select_wallet is not available in legacy mode. " +
        "Configure AGENT_WALLET_DIR and AGENT_WALLET_PASSWORD to use agent-wallet.",
    );
  }

  const p = getProvider();
  const wallet = await p.getWallet(walletId);
  const address = await wallet.getAddress();

  // Update cached state
  activeWallet = wallet;
  activeWalletId = walletId;
  activeAddress = address;

  return { id: walletId, address };
}

/**
 * List all available wallets. Returns wallet info with addresses.
 */
export async function listAgentWallets(): Promise<
  Array<{ id: string; type: string; address: string }>
> {
  if (isLegacyMode()) {
    const address = await getOwnerAddress();
    return [{ id: "default", type: "env_configured", address }];
  }

  const p = getProvider();
  const wallets = await p.listWallets();

  const result: Array<{ id: string; type: string; address: string }> = [];

  for (const w of wallets) {
    const wallet = await p.getWallet(w.id);
    const address = await wallet.getAddress();
    result.push({ id: w.id, type: w.type, address });
  }

  return result;
}

/**
 * Get the currently active wallet ID.
 */
export function getActiveWalletId(): string | null {
  if (isLegacyMode()) return "default";
  return activeWalletId;
}

// ---------------------------------------------------------------------------
// Signing
// ---------------------------------------------------------------------------

/**
 * Sign an unsigned transaction. Handles both agent-wallet and legacy modes.
 * Returns the signed transaction object (with `signature` array appended).
 */
export async function signTransaction(
  unsignedTx: Record<string, unknown>,
): Promise<any> {
  if (isLegacyMode()) {
    const privateKey = getLegacyPrivateKey();
    const network = "mainnet"; // legacy sign uses any network for signing
    const tronWeb = getWallet(privateKey, network);
    return await tronWeb.trx.sign(unsignedTx as any, privateKey);
  }

  const wallet = await getActiveWallet();
  const signedJson = await wallet.signTransaction(unsignedTx);
  return JSON.parse(signedJson);
}

/**
 * Sign using raw crypto (bypasses TronWeb's txCheck).
 * Needed for transaction types not in TronWeb's txJsonToPb mapping
 * (e.g., WitnessUpdateContract).
 */
export async function signTransactionRaw(
  unsignedTx: Record<string, unknown>,
  network = "mainnet",
): Promise<any> {
  if (isLegacyMode()) {
    const privateKey = getLegacyPrivateKey();
    const tronWeb = getTronWeb(network);
    return (tronWeb as any).utils.crypto.signTransaction(privateKey, unsignedTx);
  }

  // agent-wallet signs raw_data_hex directly — no txCheck needed
  const wallet = await getActiveWallet();
  const signedJson = await wallet.signTransaction(unsignedTx);
  return JSON.parse(signedJson);
}

/**
 * Sign an unsigned transaction and broadcast it. Returns the transaction ID.
 */
export async function buildSignBroadcast(
  unsignedTx: Record<string, unknown>,
  network = "mainnet",
): Promise<string> {
  const signedTx = await signTransaction(unsignedTx);
  const tronWeb = getTronWeb(network);
  const result = await tronWeb.trx.sendRawTransaction(signedTx as any);

  if (result.result) {
    return result.txid;
  }
  throw new Error(`Broadcast failed: ${JSON.stringify(result)}`);
}

/**
 * Sign a message using the active wallet.
 */
export async function signMessageWithWallet(message: string): Promise<string> {
  if (isLegacyMode()) {
    const privateKey = getLegacyPrivateKey();
    const apiKey = process.env.TRONGRID_API_KEY;
    const tronWeb = new TronWeb({
      fullHost: "https://api.trongrid.io",
      privateKey,
      headers: apiKey ? { "TRON-PRO-API-KEY": apiKey } : undefined,
    });
    return await tronWeb.trx.sign(message);
  }

  const wallet = await getActiveWallet();
  const msgBytes = Buffer.from(message, "utf-8");
  return await wallet.signMessage(msgBytes);
}

/**
 * Sign typed data (EIP-712) using the active wallet.
 */
export async function signTypedDataWithWallet(
  domain: object,
  types: object,
  value: object,
): Promise<string> {
  if (isLegacyMode()) {
    const privateKey = getLegacyPrivateKey();
    const apiKey = process.env.TRONGRID_API_KEY;
    const tronWeb = new TronWeb({
      fullHost: "https://api.trongrid.io",
      privateKey,
      headers: apiKey ? { "TRON-PRO-API-KEY": apiKey } : undefined,
    });
    if (typeof (tronWeb.trx as any)._signTypedData === "function") {
      return await (tronWeb.trx as any)._signTypedData(domain, types, value);
    }
    throw new Error("signTypedData not supported by this TronWeb version");
  }

  const wallet = await getActiveWallet();
  const eip712Wallet = wallet as unknown as Eip712Capable;
  if (typeof eip712Wallet.signTypedData !== "function") {
    throw new Error("Active wallet does not support signTypedData");
  }
  return await eip712Wallet.signTypedData({ domain, types, value } as any);
}

// ---------------------------------------------------------------------------
// Account generation (agent-wallet mode)
// ---------------------------------------------------------------------------

/**
 * Generate a new TRON account and store it in agent-wallet.
 * Returns the wallet ID and address. Private key is never exposed.
 */
export async function generateAndStoreAccount(
  walletName?: string,
): Promise<{ walletId: string; address: string }> {
  if (isLegacyMode()) {
    throw new Error(
      "generateAndStoreAccount requires agent-wallet mode. " +
        "Set AGENT_WALLET_DIR and AGENT_WALLET_PASSWORD.",
    );
  }

  const secretsDir = process.env.AGENT_WALLET_DIR!;
  const password = process.env.AGENT_WALLET_PASSWORD!;

  const walletId = walletName || `tron-${Date.now()}`;
  const kvStore = new SecureKVStore(secretsDir, password);
  const privateKeyBytes = kvStore.generateKey(walletId);

  // Derive TRON address
  const tempWallet = new TronWallet(privateKeyBytes);
  const address = await tempWallet.getAddress();

  // Update config
  const config = loadConfig(secretsDir);
  config.wallets[walletId] = {
    type: "tron_local",
    identity_file: walletId,
  };
  saveConfig(secretsDir, config);

  // Refresh provider to pick up new wallet, but preserve the previously active wallet
  const prevWalletId = activeWalletId;
  const prevAddress = activeAddress;
  provider = null;
  activeWallet = null;
  activeAddress = prevAddress;
  activeWalletId = prevWalletId;

  return { walletId, address };
}



// ---------------------------------------------------------------------------
// Legacy helpers (internal)
// ---------------------------------------------------------------------------

import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { HDKey } from "@scure/bip32";

function getLegacyPrivateKey(): string {
  const privateKey = process.env.TRON_PRIVATE_KEY;
  const mnemonic = process.env.TRON_MNEMONIC;
  const accountIndexStr = process.env.TRON_ACCOUNT_INDEX || "0";
  const accountIndex = parseInt(accountIndexStr, 10);

  if (isNaN(accountIndex) || accountIndex < 0 || !Number.isInteger(accountIndex)) {
    throw new Error(
      `Invalid TRON_ACCOUNT_INDEX: "${accountIndexStr}". Must be a non-negative integer.`,
    );
  }

  if (privateKey) {
    const cleanKey = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
    return cleanKey;
  } else if (mnemonic) {
    if (!bip39.validateMnemonic(mnemonic, wordlist)) {
      throw new Error("Invalid mnemonic provided in TRON_MNEMONIC");
    }
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const hdKey = HDKey.fromMasterSeed(seed);
    const child = hdKey.derive(`m/44'/195'/0'/0/${accountIndex}`);
    if (!child.privateKey) {
      throw new Error("Failed to derive private key from mnemonic");
    }
    return Buffer.from(child.privateKey).toString("hex");
  }

  throw new Error(
    "Neither TRON_PRIVATE_KEY nor TRON_MNEMONIC environment variable is set. " +
      "Configure one of them, or use agent-wallet mode with AGENT_WALLET_DIR + AGENT_WALLET_PASSWORD.",
  );
}
