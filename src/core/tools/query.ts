import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerQueryTools(registerTool: RegisterToolFn) {
  registerTool(
    "get_block_by_num",
    {
      description: "Query block by block height. Returns block header and transaction list.",
      inputSchema: {
        num: z.number().int().nonnegative().describe("Block height number"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Block By Number",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ num, network = "mainnet" }) => {
      try {
        const block = await services.getBlockByNumber(num, network);
        return { content: [{ type: "text", text: services.helpers.formatJson(block) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching block by number: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_block_by_id",
    {
      description: "Query block by block ID (hash). Returns block header and transaction list.",
      inputSchema: {
        value: z.string().describe("Block hash / ID (64-char hex string)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Block By ID",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ value, network = "mainnet" }) => {
      try {
        const block = await services.getBlockByHash(value, network);
        return { content: [{ type: "text", text: services.helpers.formatJson(block) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching block by ID: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_block_by_latest_num",
    {
      description:
        "Retrieve the most recent N blocks, starting from the latest solidified block in descending order of height.",
      inputSchema: {
        num: z
          .number()
          .int()
          .min(1)
          .max(100)
          .describe("Number of latest blocks to retrieve (1-100)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Block By Latest Num",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ num, network = "mainnet" }) => {
      try {
        const result = await services.getBlockByLatestNum(num, network);
        return { content: [{ type: "text", text: services.helpers.formatJson(result) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching latest blocks: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_block_by_limit_next",
    {
      description:
        "Retrieve a list of block objects within the specified block height range [startNum, endNum).",
      inputSchema: {
        startNum: z.number().int().nonnegative().describe("Start block height (inclusive)"),
        endNum: z.number().int().nonnegative().describe("End block height (exclusive)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Block By Limit Next",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ startNum, endNum, network = "mainnet" }) => {
      try {
        const result = await services.getBlockByLimitNext(startNum, endNum, network);
        return { content: [{ type: "text", text: services.helpers.formatJson(result) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching block range: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_now_block",
    {
      description: "Get the current latest block information from the network.",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Now Block",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const block = await services.getLatestBlock(network);
        return { content: [{ type: "text", text: services.helpers.formatJson(block) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching current block: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_transaction_by_id",
    {
      description: "Query transaction status and content by transaction hash.",
      inputSchema: {
        value: z.string().describe("Transaction hash (txID)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Transaction By ID",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ value, network = "mainnet" }) => {
      try {
        const tx = await services.getTransaction(value, network);
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
    "get_transaction_info_by_id",
    {
      description:
        "Query transaction receipt including energy usage, fee, logs, and confirmation status by transaction hash.",
      inputSchema: {
        value: z.string().describe("Transaction hash (txID)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Transaction Info By ID",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ value, network = "mainnet" }) => {
      try {
        const info = await services.getTransactionInfo(value, network);
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

  registerTool(
    "get_transaction_info_by_block_num",
    {
      description:
        "Get TransactionInfo (receipts) for all transactions in a specific block height.",
      inputSchema: {
        num: z.number().int().nonnegative().describe("Block height number"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Transaction Info By Block Num",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ num, network = "mainnet" }) => {
      try {
        const result = await services.getTransactionInfoByBlockNum(num, network);
        return { content: [{ type: "text", text: services.helpers.formatJson(result) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching transaction info by block: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_energy_prices",
    {
      description: "Query historical energy unit price on the TRON network.",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Energy Prices",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const result = await services.getEnergyPrices(network);
        return { content: [{ type: "text", text: services.helpers.formatJson(result) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching energy prices: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_bandwidth_prices",
    {
      description: "Query historical bandwidth unit price on the TRON network.",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Bandwidth Prices",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const result = await services.getBandwidthPrices(network);
        return { content: [{ type: "text", text: services.helpers.formatJson(result) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching bandwidth prices: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_burn_trx",
    {
      description:
        "Query the total amount of TRX burned from on-chain transaction fees since No. 54 Committee Proposal took effect.",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Burn TRX",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const result = await services.getBurnTrx(network);
        return { content: [{ type: "text", text: services.helpers.formatJson(result) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching burn TRX info: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_approved_list",
    {
      description:
        "Query the list of accounts that have signed a given transaction. Pass the full transaction JSON object.",
      inputSchema: {
        transaction: z.string().describe("The full signed transaction as a JSON string"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Approved List",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ transaction, network = "mainnet" }) => {
      try {
        const txObj = JSON.parse(transaction);
        const result = await services.getApprovedList(txObj, network);
        return { content: [{ type: "text", text: services.helpers.formatJson(result) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching approved list: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_block_balance",
    {
      description:
        "Get all balance change operations in a block. Requires block hash and block number. Note: requires the node to enable historical balance query.",
      inputSchema: {
        hash: z.string().describe("Block hash (64-char hex string)"),
        number: z.number().int().nonnegative().describe("Block height number"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Block Balance",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ hash, number, network = "mainnet" }) => {
      try {
        const result = await services.getBlockBalance(hash, number, network);
        return { content: [{ type: "text", text: services.helpers.formatJson(result) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching block balance: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
