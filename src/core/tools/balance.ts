import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerBalanceTools(registerTool: RegisterToolFn) {
  registerTool(
    "get_balance",
    {
      description: "Get the TRX balance for an address",
      inputSchema: {
        address: z.string().describe("The wallet address (Base58)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get TRX Balance",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address, network = "mainnet" }) => {
      try {
        const balance = await services.getTRXBalance(address, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  address,
                  balance: { sun: balance.wei.toString(), trx: balance.formatted },
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
              text: `Error fetching balance: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_token_balance",
    {
      description: "Get the TRC20 token balance for an address",
      inputSchema: {
        address: z.string().describe("The wallet address"),
        tokenAddress: z.string().describe("The TRC20 token contract address"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get TRC20 Token Balance",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address, tokenAddress, network = "mainnet" }) => {
      try {
        const balance = await services.getTRC20Balance(tokenAddress, address, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  tokenAddress,
                  address,
                  balance: {
                    raw: balance.raw.toString(),
                    formatted: balance.formatted,
                    symbol: balance.token.symbol,
                    decimals: balance.token.decimals,
                  },
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
              text: `Error fetching token balance: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
