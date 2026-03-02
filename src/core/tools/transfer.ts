import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerTransferTools(registerTool: RegisterToolFn) {
  registerTool(
    "transfer_trx",
    {
      description: "Transfer TRX to an address.",
      inputSchema: {
        to: z.string().describe("Recipient address"),
        amount: z.string().describe("Amount to send in TRX (e.g., '10.5')"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Transfer TRX",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ to, amount, network = "mainnet" }) => {
      try {
        const privateKey = services.getConfiguredPrivateKey();
        const senderAddress = services.getWalletAddressFromKey();
        const txHash = await services.transferTRX(privateKey, to, amount, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  to,
                  amount: `${amount} TRX`,
                  txHash,
                  message: "Transaction sent. Use get_transaction_info to check confirmation.",
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
              text: `Error transferring TRX: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "transfer_trc20",
    {
      description: "Transfer TRC20 tokens to an address.",
      inputSchema: {
        tokenAddress: z.string().describe("The TRC20 token contract address"),
        to: z.string().describe("Recipient address"),
        amount: z.string().describe("Amount to send (raw amount with decimals)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Transfer TRC20 Tokens",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ tokenAddress, to, amount, network = "mainnet" }) => {
      try {
        const privateKey = services.getConfiguredPrivateKey();
        const senderAddress = services.getWalletAddressFromKey();
        const result = await services.transferTRC20(tokenAddress, to, amount, privateKey, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  tokenAddress,
                  from: senderAddress,
                  to,
                  amount: result.amount.formatted,
                  symbol: result.token.symbol,
                  decimals: result.token.decimals,
                  txHash: result.txHash,
                  message: "Transaction sent.",
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
              text: `Error transferring TRC20 tokens: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
