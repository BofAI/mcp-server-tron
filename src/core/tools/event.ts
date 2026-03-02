import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerEventTools(registerTool: RegisterToolFn) {
  registerTool(
    "get_events_by_transaction_id",
    {
      description: "Get all events emitted by a specific transaction.",
      inputSchema: {
        transactionId: z.string().describe("The transaction ID (hash) to query events for"),
        onlyConfirmed: z
          .boolean()
          .optional()
          .describe("Only return confirmed events. Defaults to unset (both)."),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Events by Transaction ID",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ transactionId, onlyConfirmed, network = "mainnet" }) => {
      try {
        const result = await services.getEventsByTransactionId(
          transactionId,
          { onlyConfirmed },
          network,
        );
        return {
          content: [
            { type: "text", text: services.helpers.formatJson(services.formatEventData(result)) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching events by transaction: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_events_by_contract_address",
    {
      description: "Get recent events emitted by a specific contract address.",
      inputSchema: {
        contractAddress: z.string().describe("The contract address (base58 or hex)"),
        eventName: z.string().optional().describe("Filter by event name (e.g. Transfer)"),
        limit: z.number().optional().describe("Max events per page (default 20, max 200)"),
        fingerprint: z.string().optional().describe("Pagination token from previous response"),
        onlyConfirmed: z.boolean().optional().describe("Only return confirmed events"),
        orderBy: z
          .enum(["block_timestamp,desc", "block_timestamp,asc"])
          .optional()
          .describe("Sort order"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Events by Contract Address",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({
      contractAddress,
      eventName,
      limit,
      fingerprint,
      onlyConfirmed,
      orderBy,
      network = "mainnet",
    }) => {
      try {
        const result = await services.getEventsByContractAddress(
          contractAddress,
          { eventName, limit, fingerprint, onlyConfirmed, orderBy },
          network,
        );
        return {
          content: [
            { type: "text", text: services.helpers.formatJson(services.formatEventData(result)) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching events by contract: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_events_by_block_number",
    {
      description: "Get all events emitted in a specific block.",
      inputSchema: {
        blockNumber: z.number().describe("The block number to query events for"),
        onlyConfirmed: z.boolean().optional().describe("Only return confirmed events"),
        limit: z.number().optional().describe("Max events per page (default 20, max 200)"),
        fingerprint: z.string().optional().describe("Pagination token from previous response"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Events by Block Number",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ blockNumber, onlyConfirmed, limit, fingerprint, network = "mainnet" }) => {
      try {
        const result = await services.getEventsByBlockNumber(
          blockNumber,
          { onlyConfirmed, limit, fingerprint },
          network,
        );
        return {
          content: [
            { type: "text", text: services.helpers.formatJson(services.formatEventData(result)) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching events by block: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_events_of_latest_block",
    {
      description: "Get all events emitted in the latest block.",
      inputSchema: {
        onlyConfirmed: z.boolean().optional().describe("Only return confirmed events"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Events of Latest Block",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ onlyConfirmed, network = "mainnet" }) => {
      try {
        const result = await services.getEventsOfLatestBlock({ onlyConfirmed }, network);
        return {
          content: [
            { type: "text", text: services.helpers.formatJson(services.formatEventData(result)) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching events of latest block: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
