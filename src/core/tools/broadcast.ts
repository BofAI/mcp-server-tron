import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerBroadcastTools(registerTool: RegisterToolFn) {
  registerTool(
    "broadcast_transaction",
    {
      description:
        "Broadcast a signed transaction to the TRON network. Accepts the full signed transaction JSON object.",
      inputSchema: {
        transaction: z.string().describe("The full signed transaction as a JSON string"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Broadcast Transaction",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ transaction, network = "mainnet" }) => {
      try {
        const txObj = JSON.parse(transaction);
        const result = await services.broadcastTransaction(txObj, network);
        return { content: [{ type: "text", text: services.helpers.formatJson(result) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error broadcasting transaction: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "broadcast_hex",
    {
      description:
        "Broadcast a signed, protocol buffer-encoded transaction hex string to the TRON network.",
      inputSchema: {
        transaction: z.string().describe("Signed transaction hex string"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Broadcast Hex",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ transaction, network = "mainnet" }) => {
      try {
        const result = await services.broadcastHex(transaction, network);
        return { content: [{ type: "text", text: services.helpers.formatJson(result) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error broadcasting hex: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "create_transaction",
    {
      description:
        "Create an unsigned TRX transfer transaction. The recipient account will be auto-activated if it does not exist. Returns an unsigned transaction object that must be signed before broadcasting.",
      inputSchema: {
        ownerAddress: z.string().describe("Sender address (Base58)"),
        toAddress: z.string().describe("Recipient address (Base58)"),
        amount: z
          .number()
          .int()
          .positive()
          .describe("Transfer amount in SUN (1 TRX = 1,000,000 SUN)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Create Transaction",
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ ownerAddress, toAddress, amount, network = "mainnet" }) => {
      try {
        const result = await services.createTransaction(ownerAddress, toAddress, amount, network);
        return { content: [{ type: "text", text: services.helpers.formatJson(result) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating transaction: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
