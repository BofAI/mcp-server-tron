import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerStakingTools(registerTool: RegisterToolFn) {
  // Core Stake 2.0 staking actions
  registerTool(
    "freeze_balance_v2",
    {
      description: "Freeze TRX to get resources (Stake 2.0).",
      inputSchema: {
        amount: z.string().describe("Amount to freeze in Sun (1 TRX = 1,000,000 Sun)"),
        resource: z
          .enum(["BANDWIDTH", "ENERGY"])
          .optional()
          .describe("Resource type to get. Defaults to BANDWIDTH."),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Freeze Balance V2",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ amount, resource = "BANDWIDTH", network = "mainnet" }) => {
      try {
        const privateKey = services.getConfiguredPrivateKey();
        const senderAddress = services.getWalletAddressFromKey();
        const txHash = await services.freezeBalanceV2(
          privateKey,
          amount,
          resource as "BANDWIDTH" | "ENERGY",
          network,
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  amount: `${services.utils.fromSun(amount)} TRX`,
                  resource,
                  txHash,
                  message: "Freeze transaction sent.",
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error freezing balance: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "unfreeze_balance_v2",
    {
      description: "Unfreeze TRX to release resources (Stake 2.0).",
      inputSchema: {
        amount: z.string().describe("Amount to unfreeze in Sun (1 TRX = 1,000,000 Sun)"),
        resource: z
          .enum(["BANDWIDTH", "ENERGY"])
          .optional()
          .describe("Resource type to release. Defaults to BANDWIDTH."),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Unfreeze Balance V2",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ amount, resource = "BANDWIDTH", network = "mainnet" }) => {
      try {
        const privateKey = services.getConfiguredPrivateKey();
        const senderAddress = services.getWalletAddressFromKey();
        const txHash = await services.unfreezeBalanceV2(
          privateKey,
          amount,
          resource as "BANDWIDTH" | "ENERGY",
          network,
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  amount: `${services.utils.fromSun(amount)} TRX`,
                  resource,
                  txHash,
                  message: "Unfreeze transaction sent.",
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error unfreezing balance: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "withdraw_expire_unfreeze",
    {
      description:
        "Withdraw expired unfrozen balance (Stake 2.0). Call this after the unfreezing period to return TRX to available balance.",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Withdraw Expired Unfrozen Balance",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const privateKey = services.getConfiguredPrivateKey();
        const senderAddress = services.getWalletAddressFromKey();
        const txHash = await services.withdrawExpireUnfreeze(privateKey, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  txHash,
                  message: "Withdrawal transaction sent.",
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error withdrawing balance: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Advanced Stake 2.0 staking utilities
  registerTool(
    "cancel_all_unfreeze_v2",
    {
      description:
        "Cancel unstakings, all unstaked funds still in the waiting period will be re-staked, all unstaked funds that exceeded the 14-day waiting period will be automatically withdrawn to the owner’s account.",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Cancel All Unfreeze V2",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const privateKey = services.getConfiguredPrivateKey();
        const senderAddress = services.getWalletAddressFromKey();
        const txHash = await services.cancelAllUnfreezeV2(privateKey, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  txHash,
                  message:
                    "CancelAllUnfreezeV2 transaction sent. This re-stakes pending unfreezes and withdraws already-expired ones.",
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error cancelling all unfreeze operations: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_available_unfreeze_count",
    {
      description:
        "Get remaining available unstake (unfreeze) operations for an address in Stake 2.0.",
      inputSchema: {
        address: z.string().describe("Wallet address (Base58 or hex)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Available Unfreeze Count",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address, network = "mainnet" }) => {
      try {
        const count = await services.getAvailableUnfreezeCount(address, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  address,
                  availableUnfreezeCount: count,
                  note:
                    "Stake 2.0 allows up to 32 concurrent unstake operations. This value is the remaining quota.",
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting available unfreeze count: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_can_withdraw_unfreeze_amount",
    {
      description:
        "Get the withdrawable unstaked TRX amount for an address at a given timestamp in Stake 2.0.",
      inputSchema: {
        address: z.string().describe("Wallet address (Base58 or hex)"),
        timestampMs: z
          .string()
          .optional()
          .describe("Optional query timestamp in milliseconds. Defaults to current time."),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Can Withdraw Unfreeze Amount",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address, timestampMs, network = "mainnet" }) => {
      try {
        const ts = timestampMs ? Number(timestampMs) : undefined;
        const { amountSun, timestampMs: usedTs } = await services.getCanWithdrawUnfreezeAmount(
          address,
          network,
          ts,
        );

        const amountTrx = services.utils.fromSun(amountSun.toString());

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  address,
                  timestampMs: usedTs,
                  amountSun: amountSun.toString(),
                  amountTrx,
                  message:
                    "This is the amount of TRX currently withdrawable from Stake 2.0 unfreeze operations at the given timestamp.",
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting can withdraw unfreeze amount: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}

