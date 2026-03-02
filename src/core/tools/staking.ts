import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerStakingTools(registerTool: RegisterToolFn) {
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
}
