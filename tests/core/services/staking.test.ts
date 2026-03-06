import { describe, it, expect } from "vitest";
import {
  freezeBalanceV2,
  unfreezeBalanceV2,
  withdrawExpireUnfreeze,
  getAvailableUnfreezeCount,
  getCanWithdrawUnfreezeAmount,
  cancelAllUnfreezeV2,
} from "../../../src/core/services/staking.js";

describe("Staking Services Integration (Nile)", () => {
  // Only run if wallet is configured (agent-wallet or legacy env vars)
  const hasWallet = !!process.env.TRON_PRIVATE_KEY || !!process.env.TRON_MNEMONIC
    || !!(process.env.AGENT_WALLET_DIR && process.env.AGENT_WALLET_PASSWORD);

  it.runIf(hasWallet)(
    "freezeBalanceV2 should attempt to freeze and return error or tx hash",
    async () => {
      try {
        // Small amount to minimize impact if it actually executes
        const result = await freezeBalanceV2("1000000", "BANDWIDTH", "nile");
        expect(typeof result).toBe("string");
        console.log(`Freeze Tx ID: ${result}`);
      } catch (error: any) {
        // In integration test environment, it might fail due to balance or other network constraints
        console.log("Staking (freeze) integration feedback:", error.message);
        // We expect the call to at least reach the network and return a meaningful Tron error
        expect(error.message).toContain("Failed to freeze balance V2");
      }
    },
    30000,
  );

  it.runIf(hasWallet)(
    "unfreezeBalanceV2 should attempt to unfreeze and return error or tx hash",
    async () => {
      try {
        const result = await unfreezeBalanceV2("1000000", "BANDWIDTH", "nile");
        expect(typeof result).toBe("string");
        console.log(`Unfreeze Tx ID: ${result}`);
      } catch (error: any) {
        console.log("Staking (unfreeze) integration feedback:", error.message);
        expect(error.message).toContain("Failed to unfreeze balance V2");
      }
    },
    30000,
  );

  it.runIf(hasWallet)(
    "withdrawExpireUnfreeze should attempt to withdraw and return error or tx hash",
    async () => {
      try {
        const result = await withdrawExpireUnfreeze("nile");
        expect(typeof result).toBe("string");
        console.log(`Withdraw Tx ID: ${result}`);
      } catch (error: any) {
        console.log("Staking (withdraw) integration feedback:", error.message);
        expect(error.message).toContain("Failed to withdraw expire unfreeze");
      }
    },
    30000,
  );

  it.runIf(hasWallet)(
    "getAvailableUnfreezeCount should return a number",
    async () => {
      const address = process.env.TRON_ADDRESS;
      if (!address) {
        console.log("Skipping getAvailableUnfreezeCount test: TRON_ADDRESS not configured");
        return;
      }

      const result = await getAvailableUnfreezeCount(address, "nile");
      expect(typeof result).toBe("number");
      console.log(`Available unfreeze count: ${result}`);
    },
    30000,
  );

  it.runIf(hasWallet)(
    "getCanWithdrawUnfreezeAmount should return amount information",
    async () => {
      const address = process.env.TRON_ADDRESS;
      if (!address) {
        console.log("Skipping getCanWithdrawUnfreezeAmount test: TRON_ADDRESS not configured");
        return;
      }

      const result = await getCanWithdrawUnfreezeAmount(address, "nile");
      expect(typeof result.amountSun).toBe("bigint");
      expect(typeof result.timestampMs).toBe("number");
      console.log(
        `Can withdraw unfreeze amount (sun): ${result.amountSun.toString()} at ts=${result.timestampMs}`,
      );
    },
    30000,
  );

  it.runIf(hasWallet)(
    "cancelAllUnfreezeV2 should attempt to cancel and return error or tx hash",
    async () => {
      try {
        const result = await cancelAllUnfreezeV2("nile");
        expect(typeof result).toBe("string");
        console.log(`CancelAllUnfreezeV2 Tx ID: ${result}`);
      } catch (error: any) {
        console.log("Staking (cancelAllUnfreezeV2) integration feedback:", error.message);
        expect(error.message).toContain("Failed to cancel all unfreeze V2");
      }
    },
    30000,
  );
});
