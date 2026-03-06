import { describe, it, expect } from "vitest";
import {
  delegateResource,
  undelegateResource,
  getCanDelegatedMaxSize,
  getDelegatedResourceV2,
  getDelegatedResourceAccountIndexV2,
} from "../../../src/core/services/accountResource.js";

describe("Account Resource Services Integration (Nile)", () => {
  const hasWallet = !!process.env.TRON_PRIVATE_KEY || !!process.env.TRON_MNEMONIC
    || !!(process.env.AGENT_WALLET_DIR && process.env.AGENT_WALLET_PASSWORD);

  it.runIf(hasWallet)(
    "delegateResource should attempt to delegate and return error or tx hash",
    async () => {
      const receiverAddress =
        process.env.TRON_DELEGATEE_ADDRESS || process.env.TRON_ADDRESS || null;

      if (!receiverAddress) {
        console.log(
          "Skipping delegateResource test: neither TRON_DELEGATEE_ADDRESS nor TRON_ADDRESS configured",
        );
        return;
      }

      try {
        const txId = await delegateResource(
          {
            amount: 1_000_000, // 1 TRX in Sun
            receiverAddress,
            resource: "BANDWIDTH",
            lock: false,
          },
          "nile",
        );
        expect(typeof txId).toBe("string");
        console.log(`delegateResource Tx ID: ${txId}`);
      } catch (error: any) {
        console.log("AccountResource (delegateResource) integration feedback:", error.message);
        expect(error.message).toContain("Failed to delegate resource");
      }
    },
    30000,
  );

  it.runIf(hasWallet)(
    "undelegateResource should attempt to undelegate and return error or tx hash",
    async () => {
      const receiverAddress =
        process.env.TRON_DELEGATEE_ADDRESS || process.env.TRON_ADDRESS || null;

      if (!receiverAddress) {
        console.log(
          "Skipping undelegateResource test: neither TRON_DELEGATEE_ADDRESS nor TRON_ADDRESS configured",
        );
        return;
      }

      try {
        const txId = await undelegateResource(
          {
            amount: 500_000,
            receiverAddress,
            resource: "BANDWIDTH",
          },
          "nile",
        );
        expect(typeof txId).toBe("string");
        console.log(`undelegateResource Tx ID: ${txId}`);
      } catch (error: any) {
        console.log("AccountResource (undelegateResource) integration feedback:", error.message);
        expect(error.message).toContain("Failed to undelegate resource");
      }
    },
    30000,
  );

  it.runIf(hasWallet)(
    "getCanDelegatedMaxSize should return max delegatable amount",
    async () => {
      const address = process.env.TRON_ADDRESS;
      if (!address) {
        console.log("Skipping getCanDelegatedMaxSize test: TRON_ADDRESS not configured");
        return;
      }

      const result = await getCanDelegatedMaxSize(address, "ENERGY", "nile");
      expect(result.address).toBe(address);
      expect(result.resource).toBe("ENERGY");
      expect(typeof result.maxSizeSun).toBe("bigint");
      console.log(
        `Can delegated max size (ENERGY) for ${address}: ${result.maxSizeSun.toString()} Sun`,
      );
    },
    30000,
  );

  it.runIf(hasWallet)(
    "getDelegatedResourceV2 should return delegated resource details or empty list",
    async () => {
      const from = process.env.TRON_ADDRESS_FROM || process.env.TRON_ADDRESS;
      const to = process.env.TRON_ADDRESS_TO || process.env.TRON_ADDRESS;

      if (!from || !to) {
        console.log(
          "Skipping getDelegatedResourceV2 test: TRON_ADDRESS or pairing envs (TRON_ADDRESS_FROM / TRON_ADDRESS_TO) not configured",
        );
        return;
      }

      try {
        const result = await getDelegatedResourceV2(from, to, "nile");
        expect(result.from).toBe(from);
        expect(result.to).toBe(to);
        expect(Array.isArray(result.delegatedResource)).toBe(true);
        console.log(
          `DelegatedResourceV2 entries between ${from} -> ${to}: ${result.delegatedResource.length}`,
        );
      } catch (error: any) {
        console.log("AccountResource (getDelegatedResourceV2) integration feedback:", error.message);
        expect(error.message).toContain("Failed to get delegated resource v2");
      }
    },
    30000,
  );

  it.runIf(hasWallet)(
    "getDelegatedResourceAccountIndexV2 should return delegation index",
    async () => {
      const address = process.env.TRON_ADDRESS;
      if (!address) {
        console.log(
          "Skipping getDelegatedResourceAccountIndexV2 test: TRON_ADDRESS not configured",
        );
        return;
      }

      try {
        const result = await getDelegatedResourceAccountIndexV2(address, "nile");
        expect(result.account).toBeDefined();
        expect(Array.isArray(result.fromAccounts)).toBe(true);
        expect(Array.isArray(result.toAccounts)).toBe(true);
        console.log(
          `DelegatedResourceAccountIndexV2 for ${address}: from=${result.fromAccounts.length}, to=${result.toAccounts.length}`,
        );
      } catch (error: any) {
        console.log(
          "AccountResource (getDelegatedResourceAccountIndexV2) integration feedback:",
          error.message,
        );
        expect(error.message).toContain("Failed to get delegated resource account index v2");
      }
    },
    30000,
  );
});
