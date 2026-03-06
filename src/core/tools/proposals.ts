import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

/**
 * Register all proposal / governance-voting tools.
 * Separated from the main tools file to reduce merge conflicts in multi-developer workflows.
 */
export function registerProposalTools(registerTool: RegisterToolFn) {
  // ============================================================================
  // PROPOSALS TOOLS (Read-only)
  // ============================================================================

  registerTool(
    "list_proposals",
    {
      description: "List all network governance proposals.",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "List Proposals",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const proposals = await services.listProposals(network);
        return {
          content: [{ type: "text", text: services.helpers.formatJson(proposals) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing proposals: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_proposal",
    {
      description: "Get details of a specific governance proposal by its ID.",
      inputSchema: {
        proposalId: z.number().int().nonnegative().describe("The proposal ID"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Proposal by ID",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ proposalId, network = "mainnet" }) => {
      try {
        const proposal = await services.getProposalById(proposalId, network);
        return {
          content: [{ type: "text", text: services.helpers.formatJson(proposal) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching proposal: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ============================================================================
  // PROPOSALS TOOLS (Write operations — SR only)
  // ============================================================================

  registerTool(
    "create_proposal",
    {
      description:
        "Create a new network governance proposal (SR only). Provide a map of chain parameter IDs to proposed values.",
      inputSchema: {
        parameters: z
          .record(z.string(), z.number())
          .describe(
            "Map of chain parameter key IDs (as string numbers) to proposed values. E.g. { '6': 100 } to propose changing parameter #6 to 100.",
          ),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Create Governance Proposal",
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ parameters, network = "mainnet" }) => {
      try {
        const senderAddress = await services.getOwnerAddress();
        // Convert string keys to numbers as expected by the service
        const numericParams: Record<number, number> = {};
        for (const [k, v] of Object.entries(parameters)) {
          numericParams[Number(k)] = v;
        }
        const txHash = await services.createProposal(numericParams, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  parameters,
                  txHash,
                  message:
                    "Proposal submitted. Use get_transaction_info to check confirmation, then list_proposals to find the proposal ID.",
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
              text: `Error creating proposal: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "approve_proposal",
    {
      description: "Vote to approve or disapprove a governance proposal (SR only).",
      inputSchema: {
        proposalId: z.number().int().nonnegative().describe("The proposal ID to vote on"),
        approve: z.boolean().describe("true to approve, false to disapprove"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Approve / Reject Proposal",
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ proposalId, approve, network = "mainnet" }) => {
      try {
        const senderAddress = await services.getOwnerAddress();
        const txHash = await services.approveProposal(proposalId, approve, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  proposalId,
                  approve,
                  txHash,
                  message: `Vote ${approve ? "approved" : "disapproved"} for proposal #${proposalId}.`,
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
              text: `Error approving proposal: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "delete_proposal",
    {
      description:
        "Delete a governance proposal (SR only, only the proposal creator can delete it).",
      inputSchema: {
        proposalId: z.number().int().nonnegative().describe("The proposal ID to delete"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Delete Proposal",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ proposalId, network = "mainnet" }) => {
      try {
        const senderAddress = await services.getOwnerAddress();
        const txHash = await services.deleteProposal(proposalId, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  proposalId,
                  txHash,
                  message: `Proposal #${proposalId} deletion submitted.`,
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
              text: `Error deleting proposal: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
