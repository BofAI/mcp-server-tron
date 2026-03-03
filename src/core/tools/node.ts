import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerNodeTools(registerTool: RegisterToolFn) {
  registerTool(
    "list_nodes",
    {
      description:
        "List all connected node addresses on the TRON network. Returns an array of node IP:port strings.",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "List Nodes",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const nodes = await services.listNodes(network);
        return {
          content: [
            {
              type: "text",
              text: services.helpers.formatJson({
                nodeCount: nodes.length,
                nodes,
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing nodes: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_node_info",
    {
      description:
        "Get detailed information about the current TRON node, including version, config, peers, and machine info.",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Node Info",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const info = await services.getNodeInfo(network);
        return {
          content: [{ type: "text", text: services.helpers.formatJson(info) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching node info: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
