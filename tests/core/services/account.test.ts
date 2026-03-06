import { describe, it, expect } from "vitest";
import {
  getAccount,
  getAccountResource,
  getAccountNet,
  getDelegatedResourceIndex,
  validateAddress,
  generateAccount,
  createAccount,
  updateAccount,
} from "../../../src/core/services/account.js";

const TEST_ADDRESS = "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb";

describe("Account Services Integration (Nile)", () => {
  const hasWallet = !!process.env.TRON_PRIVATE_KEY || !!process.env.TRON_MNEMONIC
    || !!(process.env.AGENT_WALLET_DIR && process.env.AGENT_WALLET_PASSWORD);

  // ============================================================================
  // READ-ONLY TESTS
  // ============================================================================

  it("getAccount should return account info", async () => {
    const account = await getAccount(TEST_ADDRESS, "nile");
    expect(account).toBeDefined();
    // Active accounts have an address field
    if (account.address) {
      expect(account.address).toBeDefined();
    }
    console.log("Account keys:", Object.keys(account));
  }, 20000);

  it("getAccountResource should return resource info", async () => {
    const resources = await getAccountResource(TEST_ADDRESS, "nile");
    expect(resources).toBeDefined();
    // Should have at least some resource-related fields
    console.log("Resource keys:", Object.keys(resources));
  }, 20000);

  it("getAccountNet should return bandwidth info", async () => {
    const result = await getAccountNet(TEST_ADDRESS, "nile");
    expect(result.address).toBe(TEST_ADDRESS);
    expect(typeof result.bandwidth).toBe("number");
    console.log(`Bandwidth: ${result.bandwidth}`);
  }, 20000);

  it("getDelegatedResourceIndex should return delegation index", async () => {
    const result = await getDelegatedResourceIndex(TEST_ADDRESS, "nile");
    expect(result).toBeDefined();
    console.log("Delegation index keys:", Object.keys(result));
  }, 20000);

  it("validateAddress should validate a valid Base58 address", () => {
    const result = validateAddress(TEST_ADDRESS);
    expect(result.isValid).toBe(true);
    expect(result.format).toBe("base58");
    expect(result.address).toBe(TEST_ADDRESS);
  });

  it("validateAddress should detect invalid address", () => {
    const result = validateAddress("invalid_address");
    expect(result.isValid).toBe(false);
    expect(result.format).toBe("unknown");
  });

  it("validateAddress should detect hex format", () => {
    const result = validateAddress("410000000000000000000000000000000000000000");
    expect(result.isValid).toBe(true);
    expect(result.format).toBe("hex");
  });

  it("generateAccount should create a new keypair offline", async () => {
    const account = await generateAccount();
    // In legacy mode, returns { privateKey, publicKey, address }
    expect(account).toBeDefined();
    expect((account as any).address).toBeDefined();
    console.log("Generated address:", (account as any).address);
  }, 10000);

  // ============================================================================
  // WRITE TESTS (require private key)
  // ============================================================================

  it.runIf(hasWallet)(
    "createAccount should attempt to activate an address",
    async () => {
      // Generate a fresh address to activate
      const newAccount = await generateAccount();
      try {
        const txHash = await createAccount((newAccount as any).address.base58, "nile");
        expect(typeof txHash).toBe("string");
        console.log(`CreateAccount Tx ID: ${txHash}`);
      } catch (error: any) {
        // May fail if account already exists or insufficient bandwidth
        console.log("CreateAccount integration feedback:", error.message);
        expect(error.message).toContain("Failed to create account");
      }
    },
    30000,
  );

  it.runIf(hasWallet)(
    "updateAccount should attempt to set account name",
    async () => {
      try {
        const txHash = await updateAccount("TestAccount", "nile");
        expect(typeof txHash).toBe("string");
        console.log(`UpdateAccount Tx ID: ${txHash}`);
      } catch (error: any) {
        // May fail if name is already set (can only be set once)
        console.log("UpdateAccount integration feedback:", error.message);
        expect(error.message).toContain("Failed to update account");
      }
    },
    30000,
  );
});
