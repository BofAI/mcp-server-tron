import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerAccountTools(registerTool: RegisterToolFn) {
  // ============================================================================
  // ACCOUNT QUERY TOOLS (Read-only)
  // ============================================================================

  registerTool(
    "get_account",
    {
      description:
        "Get full account information including balance, resources, permissions, frozen balance, and votes.",
      inputSchema: {
        address: z.string().describe("Account address (Base58 or Hex)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Account",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address, network = "mainnet" }) => {
      try {
        const account = await services.getAccount(address, network);
        return {
          content: [{ type: "text", text: services.helpers.formatJson({ network, ...account }) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching account: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_account_balance",
    {
      description: "Get account TRX balance at a specific block height.",
      inputSchema: {
        address: z.string().describe("Account address (Base58)"),
        blockHash: z.string().describe("Block hash (hex string)"),
        blockNumber: z.number().describe("Block number"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Account Balance at Block",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address, blockHash, blockNumber, network = "mainnet" }) => {
      try {
        const result = await services.getAccountBalance(address, blockHash, blockNumber, network);
        return {
          content: [{ type: "text", text: services.helpers.formatJson({ network, ...result }) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching account balance: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "generate_account",
    {
      description:
        "Generate a new TRON account offline (keypair generation). Returns privateKey, publicKey, and address. No network interaction needed.",
      inputSchema: {},
      annotations: {
        title: "Generate Account",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const account = await services.generateAccount();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(account, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error generating account: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "validate_address",
    {
      description: "Validate a TRON address and detect its format (Base58 or Hex).",
      inputSchema: {
        address: z.string().describe("Address to validate"),
      },
      annotations: {
        title: "Validate Address",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ address }) => {
      try {
        const result = services.validateAddress(address);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error validating address: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_account_net",
    {
      description: "Get bandwidth (net) resource information for an account.",
      inputSchema: {
        address: z.string().describe("Account address (Base58 or Hex)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Account Bandwidth",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address, network = "mainnet" }) => {
      try {
        const result = await services.getAccountNet(address, network);
        return {
          content: [{ type: "text", text: JSON.stringify({ network, ...result }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching account net: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_account_resource",
    {
      description:
        "Get account resource details including energy, bandwidth, frozen balance, and delegation info.",
      inputSchema: {
        address: z.string().describe("Account address (Base58 or Hex)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Account Resources",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address, network = "mainnet" }) => {
      try {
        const resources = await services.getAccountResource(address, network);
        return {
          content: [
            { type: "text", text: services.helpers.formatJson({ network, address, ...resources }) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching account resources: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_delegated_resource",
    {
      description:
        "Query the amount of resources delegated from one account to another (Stake 2.0).",
      inputSchema: {
        fromAddress: z.string().describe("Delegator address"),
        toAddress: z.string().describe("Recipient address"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Delegated Resource",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ fromAddress, toAddress, network = "mainnet" }) => {
      try {
        const result = await services.getDelegatedResource(fromAddress, toAddress, network);
        return {
          content: [
            {
              type: "text",
              text: services.helpers.formatJson({ network, fromAddress, toAddress, ...result }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching delegated resource: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_delegated_resource_index",
    {
      description:
        "Query the resource delegation index for an account: who delegated to this account, and who this account delegated to.",
      inputSchema: {
        address: z.string().describe("Account address"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Delegated Resource Index",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address, network = "mainnet" }) => {
      try {
        const result = await services.getDelegatedResourceIndex(address, network);
        return {
          content: [
            { type: "text", text: services.helpers.formatJson({ network, address, ...result }) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching delegated resource index: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ============================================================================
  // ACCOUNT WRITE TOOLS
  // ============================================================================

  registerTool(
    "create_account",
    {
      description:
        "Activate a new account on the TRON network. Costs bandwidth from the configured wallet. The target address must be generated beforehand.",
      inputSchema: {
        address: z.string().describe("Address to activate (Base58 or Hex)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Create (Activate) Account",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ address, network = "mainnet" }) => {
      try {
        const senderAddress = await services.getOwnerAddress();
        const txHash = await services.createAccount(address, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  newAccount: address,
                  txHash,
                  message: "Account activation transaction sent.",
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
              text: `Error creating account: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "update_account",
    {
      description: "Update the name of the configured wallet's account. Can only be set once.",
      inputSchema: {
        accountName: z.string().describe("New account name"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Update Account Name",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ accountName, network = "mainnet" }) => {
      try {
        const senderAddress = await services.getOwnerAddress();
        const txHash = await services.updateAccount(accountName, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  address: senderAddress,
                  accountName,
                  txHash,
                  message: "Account name update transaction sent.",
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
              text: `Error updating account: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "account_permission_update",
    {
      description:
        "Update account permissions for multi-signature configuration. Set owner, active, and optional witness permissions.",
      inputSchema: {
        ownerPermission: z
          .object({
            type: z.number().describe("Permission type (0 for Owner)"),
            permission_name: z.string().describe("Permission name"),
            threshold: z.number().describe("Approval threshold"),
            keys: z
              .array(
                z.object({
                  address: z.string().describe("Key holder address"),
                  weight: z.number().describe("Key weight"),
                }),
              )
              .describe("List of key holders"),
          })
          .describe("Owner permission configuration"),
        activePermissions: z
          .union([
            z.object({
              type: z.number().describe("Permission type (2 for Active)"),
              permission_name: z.string(),
              threshold: z.number(),
              operations: z.string().describe("Hex string of allowed operations bitmask"),
              keys: z.array(z.object({ address: z.string(), weight: z.number() })),
            }),
            z.array(
              z.object({
                type: z.number(),
                permission_name: z.string(),
                threshold: z.number(),
                operations: z.string(),
                keys: z.array(z.object({ address: z.string(), weight: z.number() })),
              }),
            ),
          ])
          .describe("Active permission(s) configuration"),
        witnessPermission: z
          .object({
            type: z.number().describe("Permission type (1 for Witness)"),
            permission_name: z.string(),
            threshold: z.number(),
            keys: z.array(z.object({ address: z.string(), weight: z.number() })),
          })
          .optional()
          .describe("Witness permission (only for Super Representatives)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Update Account Permissions",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ ownerPermission, activePermissions, witnessPermission, network = "mainnet" }) => {
      try {
        const senderAddress = await services.getOwnerAddress();
        const txHash = await services.updateAccountPermissions(
          ownerPermission,
          activePermissions,
          witnessPermission,
          network,
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  address: senderAddress,
                  txHash,
                  message: "Account permission update transaction sent.",
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
              text: `Error updating account permissions: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
