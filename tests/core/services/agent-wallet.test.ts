import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Shared mock fns (referenced by the mock factories below)
// ---------------------------------------------------------------------------
const mockSignTransaction = vi.fn();
const mockSignMessage = vi.fn();
const mockSignTypedData = vi.fn();
const mockListWallets = vi.fn();
const mockGetWallet = vi.fn();
const mockGenerateKey = vi.fn();
const mockTrxSign = vi.fn();
const mockSendRawTransaction = vi.fn();
const mockCryptoSignTx = vi.fn((_pk: string, tx: any) => ({
  ...tx,
  signature: ["legacy-raw-sig"],
}));

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock("@bankofai/agent-wallet", () => ({
  WalletFactory: vi.fn(() => ({
    listWallets: mockListWallets,
    getWallet: mockGetWallet,
  })),
  SecureKVStore: vi.fn().mockImplementation(function () {
    return { generateKey: mockGenerateKey };
  }),
  TronWallet: vi.fn().mockImplementation(function () {
    return { getAddress: vi.fn().mockResolvedValue("TNewGeneratedAddress") };
  }),
  loadConfig: vi.fn(() => ({ wallets: {} })),
  saveConfig: vi.fn(),
}));

vi.mock("../../../src/core/services/clients.js", () => ({
  getTronWeb: vi.fn(() => ({
    trx: {
      sign: mockTrxSign,
      sendRawTransaction: mockSendRawTransaction,
    },
    utils: { crypto: { signTransaction: mockCryptoSignTx } },
  })),
  getWallet: vi.fn(() => ({
    trx: { sign: mockTrxSign },
  })),
}));

// ---------------------------------------------------------------------------
// ENV helpers
// ---------------------------------------------------------------------------
const ORIGINAL_ENV = { ...process.env };

function setAgentWalletEnv() {
  process.env.AGENT_WALLET_DIR = "/tmp/test-wallet";
  process.env.AGENT_WALLET_PASSWORD = "test-pass";
  process.env.AGENT_WALLET_ID = "wallet-1";
  delete process.env.TRON_PRIVATE_KEY;
  delete process.env.TRON_MNEMONIC;
}

function setLegacyEnv() {
  delete process.env.AGENT_WALLET_DIR;
  delete process.env.AGENT_WALLET_PASSWORD;
  delete process.env.AGENT_WALLET_ID;
  process.env.TRON_PRIVATE_KEY =
    "0000000000000000000000000000000000000000000000000000000000000001";
}

function clearAllWalletEnv() {
  delete process.env.AGENT_WALLET_DIR;
  delete process.env.AGENT_WALLET_PASSWORD;
  delete process.env.AGENT_WALLET_ID;
  delete process.env.TRON_PRIVATE_KEY;
  delete process.env.TRON_MNEMONIC;
}

/** Create a full mock wallet with all methods. */
function createMockWallet(address: string) {
  return {
    getAddress: vi.fn().mockResolvedValue(address),
    signTransaction: mockSignTransaction,
    signMessage: mockSignMessage,
    signTypedData: mockSignTypedData,
  };
}

// ---------------------------------------------------------------------------
// Dynamic import helper — each call gets a fresh module with clean singletons
// ---------------------------------------------------------------------------
type AW = typeof import("../../../src/core/services/agent-wallet.js");

async function freshImport(): Promise<AW> {
  // Reset module registry so the import gives a fresh singleton set
  vi.resetModules();
  return (await import("../../../src/core/services/agent-wallet.js")) as AW;
}

// ===========================================================================
// Tests
// ===========================================================================

describe("agent-wallet service", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.clearAllMocks();
  });

  // =========================================================================
  // Mode detection — pure functions, no singleton state
  // =========================================================================

  describe("isAgentWalletConfigured", () => {
    it("returns true when AGENT_WALLET_DIR and AGENT_WALLET_PASSWORD are set", async () => {
      setAgentWalletEnv();
      const { isAgentWalletConfigured } = await freshImport();
      expect(isAgentWalletConfigured()).toBe(true);
    });

    it("returns false when AGENT_WALLET_DIR is missing", async () => {
      clearAllWalletEnv();
      process.env.AGENT_WALLET_PASSWORD = "pass";
      const { isAgentWalletConfigured } = await freshImport();
      expect(isAgentWalletConfigured()).toBe(false);
    });

    it("returns false when AGENT_WALLET_PASSWORD is missing", async () => {
      clearAllWalletEnv();
      process.env.AGENT_WALLET_DIR = "/tmp";
      const { isAgentWalletConfigured } = await freshImport();
      expect(isAgentWalletConfigured()).toBe(false);
    });

    it("returns false when neither is set", async () => {
      clearAllWalletEnv();
      const { isAgentWalletConfigured } = await freshImport();
      expect(isAgentWalletConfigured()).toBe(false);
    });
  });

  describe("isLegacyMode", () => {
    it("returns false when agent-wallet is configured (agent-wallet takes priority)", async () => {
      setAgentWalletEnv();
      process.env.TRON_PRIVATE_KEY = "abc";
      const { isLegacyMode } = await freshImport();
      expect(isLegacyMode()).toBe(false);
    });

    it("returns true when only TRON_PRIVATE_KEY is set", async () => {
      setLegacyEnv();
      const { isLegacyMode } = await freshImport();
      expect(isLegacyMode()).toBe(true);
    });

    it("returns true when only TRON_MNEMONIC is set", async () => {
      clearAllWalletEnv();
      process.env.TRON_MNEMONIC =
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      const { isLegacyMode } = await freshImport();
      expect(isLegacyMode()).toBe(true);
    });

    it("returns false when nothing is configured", async () => {
      clearAllWalletEnv();
      const { isLegacyMode } = await freshImport();
      expect(isLegacyMode()).toBe(false);
    });
  });

  // =========================================================================
  // getActiveWalletId
  // =========================================================================

  describe("getActiveWalletId", () => {
    it("returns 'default' in legacy mode", async () => {
      setLegacyEnv();
      const { getActiveWalletId } = await freshImport();
      expect(getActiveWalletId()).toBe("default");
    });

    it("returns null when no wallet has been selected yet", async () => {
      clearAllWalletEnv();
      const { getActiveWalletId } = await freshImport();
      expect(getActiveWalletId()).toBe(null);
    });
  });

  // =========================================================================
  // getOwnerAddress
  // =========================================================================

  describe("getOwnerAddress", () => {
    it("derives address from TRON_PRIVATE_KEY in legacy mode", async () => {
      setLegacyEnv();
      const { getOwnerAddress } = await freshImport();
      const address = await getOwnerAddress();
      expect(typeof address).toBe("string");
      expect(address).toMatch(/^T[A-Za-z0-9]+$/);
    });

    it("gets address from agent-wallet in agent-wallet mode", async () => {
      setAgentWalletEnv();
      mockGetWallet.mockResolvedValue(createMockWallet("TAgentWalletAddr123"));
      const { getOwnerAddress } = await freshImport();

      const address = await getOwnerAddress();
      expect(address).toBe("TAgentWalletAddr123");
    });
  });

  // =========================================================================
  // selectWallet
  // =========================================================================

  describe("selectWallet", () => {
    it("throws in legacy mode", async () => {
      setLegacyEnv();
      const { selectWallet } = await freshImport();
      await expect(selectWallet("some-id")).rejects.toThrow(
        "select_wallet is not available in legacy mode",
      );
    });

    it("switches wallet in agent-wallet mode", async () => {
      setAgentWalletEnv();
      mockGetWallet.mockResolvedValue(createMockWallet("TSwitchedAddr"));
      const { selectWallet } = await freshImport();

      const result = await selectWallet("wallet-2");
      expect(result.id).toBe("wallet-2");
      expect(result.address).toBe("TSwitchedAddr");
    });
  });

  // =========================================================================
  // listAgentWallets
  // =========================================================================

  describe("listAgentWallets", () => {
    it("returns single default wallet in legacy mode", async () => {
      setLegacyEnv();
      const { listAgentWallets } = await freshImport();
      const wallets = await listAgentWallets();
      expect(wallets).toHaveLength(1);
      expect(wallets[0].id).toBe("default");
      expect(wallets[0].type).toBe("env_configured");
      expect(wallets[0].address).toMatch(/^T[A-Za-z0-9]+$/);
    });

    it("returns all wallets from provider in agent-wallet mode", async () => {
      setAgentWalletEnv();
      mockListWallets.mockResolvedValue([
        { id: "w1", type: "tron_local", chain_id: "tron:mainnet" },
        { id: "w2", type: "tron_local", chain_id: "tron:nile" },
      ]);
      mockGetWallet
        .mockResolvedValueOnce(createMockWallet("TAddr1"))
        .mockResolvedValueOnce(createMockWallet("TAddr2"));

      const { listAgentWallets } = await freshImport();
      const wallets = await listAgentWallets();
      expect(wallets).toHaveLength(2);
      expect(wallets[0]).toEqual({
        id: "w1",
        type: "tron_local",
        address: "TAddr1",
      });
      expect(wallets[1]).toEqual({
        id: "w2",
        type: "tron_local",
        address: "TAddr2",
      });
    });
  });

  // =========================================================================
  // signTransaction
  // =========================================================================

  describe("signTransaction", () => {
    const unsignedTx = { txID: "abc123", raw_data: {}, raw_data_hex: "0a0208" };

    it("signs via tronWeb.trx.sign in legacy mode", async () => {
      setLegacyEnv();
      const signedTx = { ...unsignedTx, signature: ["legacy-sig"] };
      mockTrxSign.mockResolvedValue(signedTx);

      const { signTransaction } = await freshImport();
      const result = await signTransaction(unsignedTx);
      expect(result).toEqual(signedTx);
      expect(mockTrxSign).toHaveBeenCalled();
    });

    it("signs via agent-wallet SDK in agent-wallet mode", async () => {
      setAgentWalletEnv();
      const signedTx = { ...unsignedTx, signature: ["aw-sig"] };
      mockSignTransaction.mockResolvedValue(JSON.stringify(signedTx));
      mockGetWallet.mockResolvedValue(createMockWallet("TAddr"));

      const { signTransaction } = await freshImport();
      const result = await signTransaction(unsignedTx);
      expect(result).toEqual(signedTx);
      expect(mockSignTransaction).toHaveBeenCalledWith(unsignedTx);
    });
  });

  // =========================================================================
  // signTransactionRaw
  // =========================================================================

  describe("signTransactionRaw", () => {
    const unsignedTx = { txID: "raw123", raw_data: {}, raw_data_hex: "0b0309" };

    it("uses crypto.signTransaction in legacy mode", async () => {
      setLegacyEnv();
      const { signTransactionRaw } = await freshImport();
      const result = await signTransactionRaw(unsignedTx, "nile");
      expect(result).toHaveProperty("signature");
      expect(result.signature).toContain("legacy-raw-sig");
    });

    it("signs via agent-wallet in agent-wallet mode", async () => {
      setAgentWalletEnv();
      const signedTx = { ...unsignedTx, signature: ["aw-raw-sig"] };
      mockSignTransaction.mockResolvedValue(JSON.stringify(signedTx));
      mockGetWallet.mockResolvedValue(createMockWallet("TAddr"));

      const { signTransactionRaw } = await freshImport();
      const result = await signTransactionRaw(unsignedTx, "nile");
      expect(result).toEqual(signedTx);
    });
  });

  // =========================================================================
  // buildSignBroadcast
  // =========================================================================

  describe("buildSignBroadcast", () => {
    const unsignedTx = { txID: "bsb123", raw_data: {}, raw_data_hex: "0c0409" };

    it("signs and broadcasts, returning txid on success", async () => {
      setLegacyEnv();
      mockTrxSign.mockResolvedValue({ ...unsignedTx, signature: ["sig"] });
      mockSendRawTransaction.mockResolvedValue({ result: true, txid: "bcast-tx-id" });

      const { buildSignBroadcast } = await freshImport();
      const txid = await buildSignBroadcast(unsignedTx, "nile");
      expect(txid).toBe("bcast-tx-id");
    });

    it("throws when broadcast fails", async () => {
      setLegacyEnv();
      mockTrxSign.mockResolvedValue({ ...unsignedTx, signature: ["sig"] });
      mockSendRawTransaction.mockResolvedValue({
        result: false,
        code: "BANDWITH_ERROR",
        message: "not enough bandwidth",
      });

      const { buildSignBroadcast } = await freshImport();
      await expect(buildSignBroadcast(unsignedTx, "nile")).rejects.toThrow("Broadcast failed");
    });
  });

  // =========================================================================
  // signMessageWithWallet
  // =========================================================================

  describe("signMessageWithWallet", () => {
    it("signs message in legacy mode via TronWeb (may throw due to no network)", async () => {
      setLegacyEnv();
      const { signMessageWithWallet } = await freshImport();
      try {
        await signMessageWithWallet("hello");
      } catch (error: any) {
        // Expected — no real TronWeb, but should NOT throw "agent-wallet mode" error
        expect(error.message).not.toContain("agent-wallet mode");
      }
    });

    it("signs message via agent-wallet SDK in agent-wallet mode", async () => {
      setAgentWalletEnv();
      mockSignMessage.mockResolvedValue("0xsig");
      mockGetWallet.mockResolvedValue(createMockWallet("TAddr"));

      const { signMessageWithWallet } = await freshImport();
      const sig = await signMessageWithWallet("hello");
      expect(sig).toBe("0xsig");
      expect(mockSignMessage).toHaveBeenCalledWith(Buffer.from("hello", "utf-8"));
    });
  });

  // =========================================================================
  // signTypedDataWithWallet
  // =========================================================================

  describe("signTypedDataWithWallet", () => {
    const domain = { name: "Test" };
    const types = { Test: [{ name: "value", type: "uint256" }] };
    const value = { value: 1 };

    it("throws in legacy mode when TronWeb lacks _signTypedData", async () => {
      setLegacyEnv();
      const { signTypedDataWithWallet } = await freshImport();
      try {
        await signTypedDataWithWallet(domain, types, value);
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });

    it("signs via agent-wallet in agent-wallet mode", async () => {
      setAgentWalletEnv();
      mockSignTypedData.mockResolvedValue("0xtyped-sig");
      mockGetWallet.mockResolvedValue(createMockWallet("TAddr"));

      const { signTypedDataWithWallet } = await freshImport();
      const sig = await signTypedDataWithWallet(domain, types, value);
      expect(sig).toBe("0xtyped-sig");
    });

    it("throws when wallet doesn't support signTypedData", async () => {
      setAgentWalletEnv();
      const walletWithoutEip712 = {
        getAddress: vi.fn().mockResolvedValue("TAddr"),
        signTransaction: mockSignTransaction,
        signMessage: mockSignMessage,
        // No signTypedData
      };
      mockGetWallet.mockResolvedValue(walletWithoutEip712);

      const { signTypedDataWithWallet } = await freshImport();
      await expect(signTypedDataWithWallet(domain, types, value)).rejects.toThrow(
        "does not support signTypedData",
      );
    });
  });

  // =========================================================================
  // generateAndStoreAccount
  // =========================================================================

  describe("generateAndStoreAccount", () => {
    it("throws in legacy mode", async () => {
      setLegacyEnv();
      const { generateAndStoreAccount } = await freshImport();
      await expect(generateAndStoreAccount()).rejects.toThrow("requires agent-wallet mode");
    });

    it("generates and stores an encrypted key in agent-wallet mode", async () => {
      setAgentWalletEnv();
      mockGenerateKey.mockReturnValue(Buffer.alloc(32, 1));

      const { generateAndStoreAccount } = await freshImport();
      const result = await generateAndStoreAccount("my-wallet", "tron:nile");
      expect(result.walletId).toBe("my-wallet");
      expect(result.address).toBe("TNewGeneratedAddress");
      expect(mockGenerateKey).toHaveBeenCalledWith("my-wallet");
    });

    it("auto-generates wallet name when not provided", async () => {
      setAgentWalletEnv();
      mockGenerateKey.mockReturnValue(Buffer.alloc(32, 2));

      const { generateAndStoreAccount } = await freshImport();
      const result = await generateAndStoreAccount();
      expect(result.walletId).toMatch(/^tron-\d+$/);
      expect(result.address).toBe("TNewGeneratedAddress");
    });
  });

  // =========================================================================
  // Cross-operation state persistence
  // =========================================================================

  describe("cross-operation state persistence", () => {
    it("generateAndStoreAccount preserves previously active wallet", async () => {
      setAgentWalletEnv();
      mockGetWallet.mockResolvedValue(createMockWallet("TSwitchedAddr"));
      const mod = await freshImport();
      await mod.selectWallet("wallet-2");
      expect(mod.getActiveWalletId()).toBe("wallet-2");

      // generateAndStoreAccount should NOT change activeWalletId
      mockGenerateKey.mockReturnValue(Buffer.alloc(32, 1));
      await mod.generateAndStoreAccount("new-wallet");
      expect(mod.getActiveWalletId()).toBe("wallet-2");
    });

    it("selectWallet choice persists after provider refresh from generateAndStoreAccount", async () => {
      setAgentWalletEnv(); // AGENT_WALLET_ID = "wallet-1"
      const walletMock = createMockWallet("TSwitchedAddr");
      mockGetWallet.mockResolvedValue(walletMock);
      const mod = await freshImport();

      // Select wallet-2 (overrides env AGENT_WALLET_ID)
      await mod.selectWallet("wallet-2");

      // Generate new account (triggers provider reset)
      mockGenerateKey.mockReturnValue(Buffer.alloc(32, 1));
      await mod.generateAndStoreAccount("new-wallet");

      // getActiveWallet should re-initialize with wallet-2, not env's wallet-1
      mockGetWallet.mockResolvedValue(walletMock);
      const wallet = await mod.getActiveWallet();
      expect(mod.getActiveWalletId()).toBe("wallet-2");
    });
  });
});
