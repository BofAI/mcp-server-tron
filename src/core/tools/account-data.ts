import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerAccountDataTools(registerTool: RegisterToolFn) {
  registerTool(
    "get_account_info",
    {
      description:
        "Get comprehensive account information from TronGrid indexed data, including TRX balance, " +
        "TRC20 balances, frozen resources, and votes. Data comes from the TronGrid indexer and may " +
        "have slight delays compared to on-chain state.",
      inputSchema: {
        address: z
          .string()
          .min(1)
          .describe("Account address (base58 T-address or hex 41-prefixed)"),
        onlyConfirmed: z.boolean().optional().describe("Only return confirmed data"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Account Info",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address, onlyConfirmed, network = "mainnet" }) => {
      try {
        const result = await services.getAccountInfo(address, { onlyConfirmed }, network);
        return {
          content: [{ type: "text", text: services.helpers.formatJson(result) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching account info: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_account_transactions",
    {
      description:
        "Get transaction history for an account from TronGrid indexed data. Returns all transaction " +
        "types (TRX transfers, contract calls, etc.). Supports pagination via limit + fingerprint. " +
        "Default 20 results, max 200 per page.",
      inputSchema: {
        address: z
          .string()
          .min(1)
          .describe("Account address (base58 T-address or hex 41-prefixed)"),
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
        title: "Get Account Transactions",
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
        const result = await services.getAccountTransactions(
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
              text: `Error fetching account transactions: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_account_trc20_transactions",
    {
      description:
        "Get TRC20 token transfer history for an account from TronGrid indexed data. Returns token " +
        "transfer details including token info (name, symbol, decimals) and human-readable values. " +
        "Supports pagination via limit + fingerprint. Default 20 results, max 200 per page.",
      inputSchema: {
        address: z
          .string()
          .min(1)
          .describe("Account address (base58 T-address or hex 41-prefixed)"),
        contractAddress: z
          .string()
          .optional()
          .describe("Filter by specific TRC20 token contract address"),
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
        title: "Get Account TRC20 Transactions",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({
      address,
      contractAddress,
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
        const result = await services.getAccountTrc20Transactions(
          address,
          {
            contractAddress,
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
              text: `Error fetching TRC20 transactions: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_account_internal_transactions",
    {
      description:
        "Get internal transactions (triggered by smart contract execution) for an account from " +
        "TronGrid indexed data. Supports pagination via limit + fingerprint. Default 20, max 200.",
      inputSchema: {
        address: z
          .string()
          .min(1)
          .describe("Account address (base58 T-address or hex 41-prefixed)"),
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
        title: "Get Account Internal Transactions",
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
        const result = await services.getAccountInternalTransactions(
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
              text: `Error fetching internal transactions: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_account_trc20_balances",
    {
      description:
        "Get all TRC20 token balances for an account from TronGrid indexed data. Returns only " +
        "token contract addresses and raw balances — does NOT include token metadata (name, symbol, " +
        "decimals). Use get_token_balance for detailed info on a specific token.",
      inputSchema: {
        address: z
          .string()
          .min(1)
          .describe("Account address (base58 T-address or hex 41-prefixed)"),
        onlyConfirmed: z.boolean().optional().describe("Only return confirmed data"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Account TRC20 Balances",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address, onlyConfirmed, network = "mainnet" }) => {
      try {
        const result = await services.getAccountTrc20Balances(address, { onlyConfirmed }, network);
        return {
          content: [{ type: "text", text: services.helpers.formatJson(result) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching TRC20 balances: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
