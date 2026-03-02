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
import { getConfiguredPrivateKey } from "../../../src/core/services/wallet.js";

const TEST_ADDRESS = "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb";

describe("Account Services Integration (Nile)", () => {
  const hasPrivateKey = !!process.env.TRON_PRIVATE_KEY || !!process.env.TRON_MNEMONIC;

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
    expect(account.privateKey).toBeDefined();
    expect(typeof account.privateKey).toBe("string");
    expect(account.publicKey).toBeDefined();
    expect(account.address).toBeDefined();
    console.log("Generated address:", account.address);
  }, 10000);

  // ============================================================================
  // WRITE TESTS (require private key)
  // ============================================================================

  it.runIf(hasPrivateKey)(
    "createAccount should attempt to activate an address",
    async () => {
      const privateKey = getConfiguredPrivateKey();
      // Generate a fresh address to activate
      const newAccount = await generateAccount();
      try {
        const txHash = await createAccount(privateKey, newAccount.address.base58, "nile");
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

  it.runIf(hasPrivateKey)(
    "updateAccount should attempt to set account name",
    async () => {
      const privateKey = getConfiguredPrivateKey();
      try {
        const txHash = await updateAccount(privateKey, "TestAccount", "nile");
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

  it.runIf(hasPrivateKey)(
    "full lifecycle: generate + create + updateAccount on new account",
    async () => {
      const configuredKey = getConfiguredPrivateKey();

      // 1. Generate a new account offline
      const newAccount = await generateAccount();
      console.log("Generated new address:", newAccount.address.base58);

      // 2. Activate it on-chain using configured wallet
      const createTx = await createAccount(configuredKey, newAccount.address.base58, "nile");
      expect(typeof createTx).toBe("string");
      console.log(`CreateAccount Tx ID: ${createTx}`);

      // 3. Wait for transaction confirmation
      await new Promise((r) => setTimeout(r, 5000));

      // 4. Set account name using the new account's own private key
      const accountName = "Test_" + Date.now();
      const updateTx = await updateAccount(newAccount.privateKey, accountName, "nile");
      expect(typeof updateTx).toBe("string");
      console.log(`UpdateAccount Tx ID: ${updateTx}, name: ${accountName}`);
    },
    60000,
  );
});
