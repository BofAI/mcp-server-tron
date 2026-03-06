import { describe, it, expect } from "vitest";
import {
  listWitnesses,
  getPaginatedWitnessList,
  getNextMaintenanceTime,
  getReward,
  getBrokerage,
  createWitness,
  updateWitness,
  voteWitness,
  withdrawBalance,
  updateBrokerage,
} from "../../../src/core/services/governance.js";

const TEST_ADDRESS = "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb";

describe("Governance Services Integration (Nile)", () => {
  const hasWallet = !!process.env.TRON_PRIVATE_KEY || !!process.env.TRON_MNEMONIC
    || !!(process.env.AGENT_WALLET_DIR && process.env.AGENT_WALLET_PASSWORD);

  // ============================================================================
  // READ-ONLY TESTS
  // ============================================================================

  it("listWitnesses should return an array of witnesses", async () => {
    const witnesses = await listWitnesses("nile");
    expect(Array.isArray(witnesses)).toBe(true);
    expect(witnesses.length).toBeGreaterThan(0);
    console.log(`Found ${witnesses.length} witnesses on Nile`);
  }, 20000);

  it("getPaginatedWitnessList should return paginated results", async () => {
    const result = await getPaginatedWitnessList(0, 5, "nile");
    expect(result.witnesses).toBeDefined();
    expect(Array.isArray(result.witnesses)).toBe(true);
    expect(result.witnesses.length).toBeLessThanOrEqual(5);
    expect(typeof result.total).toBe("number");
    expect(result.offset).toBe(0);
    expect(result.limit).toBe(5);
    console.log(`Paginated: ${result.witnesses.length}/${result.total} witnesses`);
  }, 20000);

  it("getNextMaintenanceTime should return maintenance time info", async () => {
    const result = await getNextMaintenanceTime("nile");
    expect(typeof result.secondsUntilNextMaintenance).toBe("number");
    expect(typeof result.nextMaintenanceTimestamp).toBe("number");
    expect(result.nextMaintenanceDate).toBeDefined();
    console.log(`Next maintenance: ${result.nextMaintenanceDate}`);
  }, 20000);

  it("getReward should return a reward value", async () => {
    const reward = await getReward(TEST_ADDRESS, "nile");
    expect(reward).toBeDefined();
    console.log(`Reward for ${TEST_ADDRESS}: ${reward}`);
  }, 20000);

  it("getBrokerage should return a brokerage value", async () => {
    // Use a known SR address on Nile or fallback to test address
    const witnesses = await listWitnesses("nile");
    const srAddress =
      witnesses.length > 0 ? witnesses[0].address : TEST_ADDRESS;

    const brokerage = await getBrokerage(srAddress, "nile");
    expect(brokerage).toBeDefined();
    console.log(`Brokerage for ${srAddress}: ${brokerage}`);
  }, 20000);

  // ============================================================================
  // WRITE TESTS (require private key)
  // ============================================================================

  it.runIf(hasWallet)(
    "createWitness should attempt to apply for SR and return error or tx hash",
    async () => {
      try {
        const txHash = await createWitness("https://example.com", "nile");
        expect(typeof txHash).toBe("string");
        console.log(`createWitness Tx ID: ${txHash}`);
      } catch (error: any) {
        // Expected to fail — account may not meet SR requirements
        console.log("Governance (createWitness) integration feedback:", error.message);
        expect(error.message).toContain("Failed to create witness");
      }
    },
    30000,
  );

  it.runIf(hasWallet)(
    "updateWitness should attempt to update SR URL and return error or tx hash",
    async () => {
      try {
        const txHash = await updateWitness("https://example.com/updated", "nile");
        expect(typeof txHash).toBe("string");
        console.log(`updateWitness Tx ID: ${txHash}`);
      } catch (error: any) {
        console.log("Governance (updateWitness) integration feedback:", error.message);
        expect(error.message).toContain("Failed to update witness");
      }
    },
    30000,
  );

  it.runIf(hasWallet)(
    "voteWitness should attempt to vote and return error or tx hash",
    async () => {
      // Get a valid SR address to vote for
      const witnesses = await listWitnesses("nile");
      if (witnesses.length === 0) {
        console.log("Skipping voteWitness test: no witnesses found on Nile");
        return;
      }

      try {
        const txHash = await voteWitness(
          [{ address: witnesses[0].address, voteCount: 1 }],
          "nile",
        );
        expect(typeof txHash).toBe("string");
        console.log(`voteWitness Tx ID: ${txHash}`);
      } catch (error: any) {
        // Expected to fail — account may not have TRON Power
        console.log("Governance (voteWitness) integration feedback:", error.message);
        expect(error.message).toContain("Failed to vote for witness");
      }
    },
    30000,
  );

  it.runIf(hasWallet)(
    "withdrawBalance should attempt to withdraw rewards and return error or tx hash",
    async () => {
      try {
        const txHash = await withdrawBalance("nile");
        expect(typeof txHash).toBe("string");
        console.log(`withdrawBalance Tx ID: ${txHash}`);
      } catch (error: any) {
        console.log("Governance (withdrawBalance) integration feedback:", error.message);
        expect(error.message).toContain("Failed to withdraw balance");
      }
    },
    30000,
  );

  it.runIf(hasWallet)(
    "updateBrokerage should attempt to set brokerage ratio and return error or tx hash",
    async () => {
      try {
        const txHash = await updateBrokerage(20, "nile");
        expect(typeof txHash).toBe("string");
        console.log(`updateBrokerage Tx ID: ${txHash}`);
      } catch (error: any) {
        console.log("Governance (updateBrokerage) integration feedback:", error.message);
        expect(error.message).toContain("Failed to update brokerage");
      }
    },
    30000,
  );
});
