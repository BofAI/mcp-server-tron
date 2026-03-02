import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerTransactionTools(registerTool: RegisterToolFn) {
  registerTool(
    "get_transaction",
    {
      description: "Get transaction details by transaction hash",
      inputSchema: {
        txHash: z.string().describe("Transaction hash"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Transaction",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ txHash, network = "mainnet" }) => {
      try {
        const tx = await services.getTransaction(txHash, network);
        return { content: [{ type: "text", text: services.helpers.formatJson(tx) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching transaction: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_transaction_info",
    {
      description: "Get transaction info (receipt/confirmation status, energy usage, logs).",
      inputSchema: {
        txHash: z.string().describe("Transaction hash"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Transaction Info",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ txHash, network = "mainnet" }) => {
      try {
        const info = await services.getTransactionInfo(txHash, network);
        return { content: [{ type: "text", text: services.helpers.formatJson(info) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching transaction info: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
