import { describe, it, expect } from "vitest";
import {
  freezeBalanceV2,
  unfreezeBalanceV2,
  withdrawExpireUnfreeze,
  cancelAllUnfreezeV2,
} from "../../../src/core/services/staking.js";
import { getConfiguredPrivateKey } from "../../../src/core/services/wallet.js";

describe("Staking Services Integration (Nile)", () => {
  // Only run if private key is provided via environment variables
  const hasPrivateKey = !!process.env.TRON_PRIVATE_KEY || !!process.env.TRON_MNEMONIC;

  it.runIf(hasPrivateKey)(
    "freezeBalanceV2 should attempt to freeze and return error or tx hash",
    async () => {
      const privateKey = getConfiguredPrivateKey();
      try {
        // Small amount to minimize impact if it actually executes
        const result = await freezeBalanceV2(privateKey, 1000000, "BANDWIDTH", "nile");
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

  it.runIf(hasPrivateKey)(
    "unfreezeBalanceV2 should attempt to unfreeze and return error or tx hash",
    async () => {
      const privateKey = getConfiguredPrivateKey();
      try {
        const result = await unfreezeBalanceV2(privateKey, 1000000, "BANDWIDTH", "nile");
        expect(typeof result).toBe("string");
        console.log(`Unfreeze Tx ID: ${result}`);
      } catch (error: any) {
        console.log("Staking (unfreeze) integration feedback:", error.message);
        expect(error.message).toContain("Failed to unfreeze balance V2");
      }
    },
    30000,
  );

  it.runIf(hasPrivateKey)(
    "withdrawExpireUnfreeze should attempt to withdraw and return error or tx hash",
    async () => {
      const privateKey = getConfiguredPrivateKey();
      try {
        const result = await withdrawExpireUnfreeze(privateKey, "nile");
        expect(typeof result).toBe("string");
        console.log(`Withdraw Tx ID: ${result}`);
      } catch (error: any) {
        console.log("Staking (withdraw) integration feedback:", error.message);
        expect(error.message).toContain("Failed to withdraw expire unfreeze");
      }
    },
    30000,
  );

  it.runIf(hasPrivateKey)(
    "cancelAllUnfreezeV2 should attempt to cancel and return error or tx hash",
    async () => {
      const privateKey = getConfiguredPrivateKey();
      try {
        const result = await cancelAllUnfreezeV2(privateKey, "nile");
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
