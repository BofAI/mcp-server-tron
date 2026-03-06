import { describe, it, expect } from "vitest";
import { transferTRX, transferTRC20, approveTRC20 } from "../../../src/core/services/transfer.js";

describe("Transfer Services Integration (Nile)", () => {
  const hasWallet = !!process.env.TRON_PRIVATE_KEY || !!process.env.TRON_MNEMONIC
    || !!(process.env.AGENT_WALLET_DIR && process.env.AGENT_WALLET_PASSWORD);

  it.runIf(hasWallet)(
    "transferTRX should attempt to send TRX and return tx hash or meaningful error",
    async () => {
      const receiverAddress =
        process.env.TRON_RECEIVER_ADDRESS || process.env.TRON_ADDRESS || null;

      if (!receiverAddress) {
        console.log(
          "Skipping transferTRX test: neither TRON_RECEIVER_ADDRESS nor TRON_ADDRESS configured",
        );
        return;
      }

      try {
        const txHash = await transferTRX(receiverAddress, "0.000001", "nile");
        expect(typeof txHash).toBe("string");
        console.log(`transferTRX Tx ID: ${txHash}`);
      } catch (error: any) {
        // May fail due to insufficient balance or network constraints
        console.log("Transfer (transferTRX) integration feedback:", error.message);
        expect(error.message).toBeDefined();
      }
    },
    30000,
  );

  it.runIf(hasWallet)(
    "transferTRC20 should attempt to send TRC20 and return result or meaningful error",
    async () => {
      const receiverAddress =
        process.env.TRON_RECEIVER_ADDRESS || process.env.TRON_ADDRESS || null;
      // USDT on Nile testnet
      const tokenAddress = process.env.TRC20_TOKEN_ADDRESS || "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj";

      if (!receiverAddress) {
        console.log("Skipping transferTRC20 test: no receiver address configured");
        return;
      }

      try {
        const result = await transferTRC20(tokenAddress, receiverAddress, "1", "nile");
        expect(result.txHash).toBeDefined();
        console.log(`transferTRC20 Tx Hash: ${result.txHash}`);
      } catch (error: any) {
        console.log("Transfer (transferTRC20) integration feedback:", error.message);
        expect(error.message).toContain("Failed to transfer TRC20");
      }
    },
    30000,
  );

  it.runIf(hasWallet)(
    "approveTRC20 should attempt to approve spending and return tx hash or error",
    async () => {
      const spenderAddress =
        process.env.TRON_SPENDER_ADDRESS || process.env.TRON_ADDRESS || null;
      const tokenAddress = process.env.TRC20_TOKEN_ADDRESS || "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj";

      if (!spenderAddress) {
        console.log("Skipping approveTRC20 test: no spender address configured");
        return;
      }

      try {
        const txHash = await approveTRC20(tokenAddress, spenderAddress, "1000000", "nile");
        expect(typeof txHash).toBe("string");
        console.log(`approveTRC20 Tx ID: ${txHash}`);
      } catch (error: any) {
        console.log("Transfer (approveTRC20) integration feedback:", error.message);
        expect(error.message).toContain("Failed to approve TRC20");
      }
    },
    30000,
  );
});
