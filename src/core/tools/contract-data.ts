import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerContractDataTools(registerTool: RegisterToolFn) {
  registerTool(
    "get_contract_transactions",
    {
      description:
        "Get transaction history for a smart contract from TronGrid indexed data. Unlike " +
        "get_account_transactions, this aggregates transactions BY contract. Supports pagination " +
        "via limit + fingerprint. Default 20 results, max 200 per page.",
      inputSchema: {
        address: z
          .string()
          .min(1)
          .describe("Contract address (base58 T-address or hex 41-prefixed)"),
        limit: z
          .number()
          .max(200)
          .optional()
          .describe("Max transactions per page (default 20, max 200)"),
        fingerprint: z.string().optional().describe("Pagination token from previous response"),
        onlyConfirmed: z.boolean().optional().describe("Only return confirmed transactions"),
        onlyUnconfirmed: z.boolean().optional().describe("Only return unconfirmed transactions"),
        orderBy: z.string().optional().describe("Sort field, e.g. 'block_timestamp,desc'"),
        minTimestamp: z.number().optional().describe("Filter: minimum block timestamp (ms)"),
        maxTimestamp: z.number().optional().describe("Filter: maximum block timestamp (ms)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Contract Transactions",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({
      address,
      limit,
      fingerprint,
      onlyConfirmed,
      onlyUnconfirmed,
      orderBy,
      minTimestamp,
      maxTimestamp,
      network = "mainnet",
    }) => {
      try {
        const result = await services.getContractTransactions(
          address,
          {
            limit,
            fingerprint,
            onlyConfirmed,
            onlyUnconfirmed,
            orderBy,
            minTimestamp,
            maxTimestamp,
          },
          network,
        );
        return {
          content: [{ type: "text", text: services.helpers.formatJson(result) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching contract transactions: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_contract_internal_transactions",
    {
      description:
        "Get internal transactions (triggered by smart contract execution) for a contract address " +
        "from TronGrid indexed data. Supports pagination via limit + fingerprint. Default 20, max 200.",
      inputSchema: {
        address: z
          .string()
          .min(1)
          .describe("Contract address (base58 T-address or hex 41-prefixed)"),
        limit: z
          .number()
          .max(200)
          .optional()
          .describe("Max transactions per page (default 20, max 200)"),
        fingerprint: z.string().optional().describe("Pagination token from previous response"),
        onlyConfirmed: z.boolean().optional().describe("Only return confirmed transactions"),
        onlyUnconfirmed: z.boolean().optional().describe("Only return unconfirmed transactions"),
        orderBy: z.string().optional().describe("Sort field, e.g. 'block_timestamp,desc'"),
        minTimestamp: z.number().optional().describe("Filter: minimum block timestamp (ms)"),
        maxTimestamp: z.number().optional().describe("Filter: maximum block timestamp (ms)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Contract Internal Transactions",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({
      address,
      limit,
      fingerprint,
      onlyConfirmed,
      onlyUnconfirmed,
      orderBy,
      minTimestamp,
      maxTimestamp,
      network = "mainnet",
    }) => {
      try {
        const result = await services.getContractInternalTransactions(
          address,
          {
            limit,
            fingerprint,
            onlyConfirmed,
            onlyUnconfirmed,
            orderBy,
            minTimestamp,
            maxTimestamp,
          },
          network,
        );
        return {
          content: [{ type: "text", text: services.helpers.formatJson(result) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching contract internal transactions: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_trc20_token_holders",
    {
      description:
        "Get token holder list for a TRC20 contract from TronGrid indexed data. Returns " +
        "holder addresses and their balances. Supports pagination via limit + fingerprint.",
      inputSchema: {
        address: z
          .string()
          .min(1)
          .describe("TRC20 token contract address (base58 T-address or hex 41-prefixed)"),
        limit: z
          .number()
          .max(200)
          .optional()
          .describe("Max holders per page (default 20, max 200)"),
        fingerprint: z.string().optional().describe("Pagination token from previous response"),
        orderBy: z.string().optional().describe("Sort field, e.g. 'balance,desc'"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get TRC20 Token Holders",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address, limit, fingerprint, orderBy, network = "mainnet" }) => {
      try {
        const result = await services.getTrc20TokenHolders(
          address,
          { limit, fingerprint, orderBy },
          network,
        );
        return {
          content: [{ type: "text", text: services.helpers.formatJson(result) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching token holders: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
