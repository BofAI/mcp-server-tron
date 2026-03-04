import { z } from "zod";
import { getSupportedNetworks, getRpcUrl } from "../chains.js";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerNetworkTools(registerTool: RegisterToolFn) {
  registerTool(
    "get_chain_info",
    {
      description: "Get information about a TRON network: current block number and RPC endpoint",
      inputSchema: {
        network: z
          .string()
          .optional()
          .describe("Network name (mainnet, nile, shasta). Defaults to mainnet."),
      },
      annotations: {
        title: "Get Chain Info",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const chainId = await services.getChainId(network);
        const blockNumber = await services.getBlockNumber(network);
        const rpcUrl = getRpcUrl(network);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { network, chainId, blockNumber: blockNumber.toString(), rpcUrl },
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
              text: `Error fetching chain info: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_supported_networks",
    {
      description: "Get a list of all supported TRON networks",
      inputSchema: {},
      annotations: {
        title: "Get Supported Networks",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const networks = getSupportedNetworks();
        return {
          content: [
            { type: "text", text: JSON.stringify({ supportedNetworks: networks }, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_chain_parameters",
    {
      description:
        "Get current chain parameters including Energy and Bandwidth unit prices. Returns structured fee information similar to gas price queries.",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Chain Parameters",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const result = await services.getChainParameters(network);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching chain parameters: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
