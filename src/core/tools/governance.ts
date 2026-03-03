import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

/**
 * Register all governance / Super Representative tools.
 * Separated from the main tools file to reduce merge conflicts in multi-developer workflows.
 */
export function registerGovernanceTools(registerTool: RegisterToolFn) {
  // ============================================================================
  // GOVERNANCE — SUPER REPRESENTATIVE TOOLS (Read-only)
  // ============================================================================

  registerTool(
    "list_witnesses",
    {
      description:
        "Get the full list of all Super Representatives (SR / witnesses) on the network.",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "List Super Representatives",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const witnesses = await services.listWitnesses(network);
        return {
          content: [{ type: "text", text: services.helpers.formatJson(witnesses) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing witnesses: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_paginated_witnesses",
    {
      description: "Get a paginated list of current active Super Representatives.",
      inputSchema: {
        offset: z.number().optional().describe("Pagination offset (default: 0)"),
        limit: z.number().optional().describe("Number of results per page (default: 20)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Paginated Witness List",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ offset = 0, limit = 20, network = "mainnet" }) => {
      try {
        const result = await services.getPaginatedWitnessList(offset, limit, network);
        return {
          content: [{ type: "text", text: services.helpers.formatJson(result) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching paginated witnesses: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_next_maintenance_time",
    {
      description: "Get the timestamp of the next network maintenance window.",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Next Maintenance Time",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const result = await services.getNextMaintenanceTime(network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ network, nextMaintenanceTime: result }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching maintenance time: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_reward",
    {
      description: "Query the current unclaimed voting reward for an address.",
      inputSchema: {
        address: z.string().describe("The address to query rewards for"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Voting Reward",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ address, network = "mainnet" }) => {
      try {
        const reward = await services.getReward(address, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ network, address, reward }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching reward: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_brokerage",
    {
      description:
        "Query the brokerage ratio (dividend percentage) of a Super Representative. The brokerage value is the percentage that the SR keeps; the rest is distributed to voters.",
      inputSchema: {
        witnessAddress: z.string().describe("The SR witness address"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get SR Brokerage Ratio",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ witnessAddress, network = "mainnet" }) => {
      try {
        const brokerage = await services.getBrokerage(witnessAddress, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  witnessAddress,
                  brokerage,
                  description: `SR keeps ${brokerage}% of rewards; voters receive ${100 - brokerage}%`,
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
              text: `Error fetching brokerage: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ============================================================================
  // GOVERNANCE — SUPER REPRESENTATIVE TOOLS (Write operations)
  // ============================================================================

  registerTool(
    "create_witness",
    {
      description:
        "Apply to become a Super Representative (SR). Requires the configured wallet and burns 9999 TRX as application fee.",
      inputSchema: {
        url: z.string().describe("The official website URL of the SR candidate"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Apply to Become SR",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ url, network = "mainnet" }) => {
      try {
        const privateKey = services.getConfiguredPrivateKey();
        const senderAddress = services.getWalletAddressFromKey();
        const txHash = await services.createWitness(privateKey, url, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  url,
                  txHash,
                  message:
                    "SR application submitted. Use get_transaction_info to check confirmation.",
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
              text: `Error creating witness: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "update_witness",
    {
      description:
        "Update the SR node website URL for the configured wallet (must already be an SR).",
      inputSchema: {
        url: z.string().describe("The new official website URL for the SR"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Update SR Node Info",
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ url, network = "mainnet" }) => {
      try {
        const privateKey = services.getConfiguredPrivateKey();
        const senderAddress = services.getWalletAddressFromKey();
        const txHash = await services.updateWitness(privateKey, url, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  url,
                  txHash,
                  message: "SR info update submitted.",
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
              text: `Error updating witness: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "vote_witness",
    {
      description:
        "Vote for Super Representatives using TRON Power (obtained by freezing TRX). Each frozen TRX = 1 vote.",
      inputSchema: {
        votes: z
          .array(
            z.object({
              address: z.string().describe("SR address to vote for"),
              voteCount: z.number().int().positive().describe("Number of votes to allocate"),
            }),
          )
          .min(1)
          .describe("List of SR addresses and vote counts"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Vote for Super Representatives",
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ votes, network = "mainnet" }) => {
      try {
        const privateKey = services.getConfiguredPrivateKey();
        const senderAddress = services.getWalletAddressFromKey();
        const txHash = await services.voteWitness(privateKey, votes, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  votes,
                  txHash,
                  message: "Vote submitted. Use get_transaction_info to check confirmation.",
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
              text: `Error voting for witness: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "withdraw_balance",
    {
      description:
        "Withdraw accumulated voting rewards to the configured wallet's available balance.",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Withdraw Voting Rewards",
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const privateKey = services.getConfiguredPrivateKey();
        const senderAddress = services.getWalletAddressFromKey();
        const txHash = await services.withdrawBalance(privateKey, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  txHash,
                  message: "Reward withdrawal submitted.",
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
              text: `Error withdrawing balance: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "update_brokerage",
    {
      description:
        "Update the SR brokerage ratio (dividend ratio). Only callable by an SR. Value is the percentage the SR keeps (0-100); the remainder goes to voters.",
      inputSchema: {
        brokerage: z
          .number()
          .int()
          .min(0)
          .max(100)
          .describe("Brokerage percentage kept by the SR (0-100). E.g. 20 means SR keeps 20%."),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Update SR Brokerage Ratio",
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ brokerage, network = "mainnet" }) => {
      try {
        const privateKey = services.getConfiguredPrivateKey();
        const senderAddress = services.getWalletAddressFromKey();
        const txHash = await services.updateBrokerage(privateKey, brokerage, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  brokerage,
                  voterShare: 100 - brokerage,
                  txHash,
                  message: "Brokerage update submitted.",
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
              text: `Error updating brokerage: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
