import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerMempoolTools(registerTool: RegisterToolFn) {
  registerTool(
    "get_pending_transactions",
    {
      description: "Get the list of transaction IDs currently in the pending pool (mempool).",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Pending Transactions",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const txIds = await services.getTransactionListFromPending(network);
        return {
          content: [
            {
              type: "text",
              text: services.helpers.formatJson({
                pendingCount: txIds.length,
                transactionIds: txIds,
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching pending transactions: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_transaction_from_pending",
    {
      description:
        "Get the details of a specific transaction from the pending pool by its transaction ID.",
      inputSchema: {
        txId: z
          .string()
          .length(64, "Transaction ID must be a 64-character hex string")
          .regex(/^[0-9a-fA-F]{64}$/, "Transaction ID must be a valid hex string")
          .describe("The transaction ID (hash) to look up in the pending pool"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Transaction From Pending",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ txId, network = "mainnet" }) => {
      try {
        const tx = await services.getTransactionFromPending(txId, network);
        return {
          content: [{ type: "text", text: services.helpers.formatJson(tx) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching transaction from pending: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_pending_size",
    {
      description: "Get the number of transactions currently in the pending pool (mempool).",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Pending Size",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const size = await services.getPendingSize(network);
        return {
          content: [
            {
              type: "text",
              text: services.helpers.formatJson({ pendingTransactionSize: size }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching pending size: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
