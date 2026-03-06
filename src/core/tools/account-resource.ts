import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerAccountResourceTools(registerTool: RegisterToolFn) {
  // ============================================================================
  // ACCOUNT RESOURCE TOOLS (Delegate resources)
  // ============================================================================

  registerTool(
    "delegate_resource",
    {
      description:
        "Delegate staked resources (BANDWIDTH or ENERGY) from the configured wallet to another address.",
      inputSchema: {
        receiverAddress: z.string().describe("The address that will receive the delegated resources"),
        amount: z
          .number()
          .describe("Amount of resources to delegate in Sun (1 TRX = 1,000,000 Sun)"),
        resource: z
          .enum(["BANDWIDTH", "ENERGY"])
          .describe("Resource type to delegate (BANDWIDTH or ENERGY)"),
        lock: z
          .boolean()
          .optional()
          .describe(
            "Whether the delegation is locked (non-revocable within the lock period). Defaults to false.",
          ),
        lockPeriod: z
          .number()
          .optional()
          .describe(
            "Lock period in blocks when lock is true. Ignored if lock is false. Defaults to 0.",
          ),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Delegate Resource",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({
      receiverAddress,
      amount,
      resource,
      lock,
      lockPeriod,
      network = "mainnet",
    }) => {
      try {
        const senderAddress = await services.getOwnerAddress();
        const txHash = await services.delegateResource(
          {
            amount,
            receiverAddress,
            resource: resource as "BANDWIDTH" | "ENERGY",
            lock,
            lockPeriod,
          },
          network,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  to: receiverAddress,
                  amount,
                  resource,
                  lock: lock ?? false,
                  lockPeriod: lock ? lockPeriod ?? 0 : 0,
                  txHash,
                  message:
                    "Delegate resource transaction sent. Make sure you have enough frozen balance to cover this delegation.",
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
              text: `Error delegating resource: ${error instanceof Error ? error.message : String(
                error,
              )}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "undelegate_resource",
    {
      description:
        "Revoke previously delegated staked resources (BANDWIDTH or ENERGY) from a receiver address back to the configured wallet.",
      inputSchema: {
        receiverAddress: z.string().describe(
          "The address from which delegated resources will be revoked",
        ),
        amount: z
          .number()
          .describe("Amount of resources to revoke in Sun (1 TRX = 1,000,000 Sun)"),
        resource: z
          .enum(["BANDWIDTH", "ENERGY"])
          .describe("Resource type to revoke (BANDWIDTH or ENERGY)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Undelegate Resource",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ receiverAddress, amount, resource, network = "mainnet" }) => {
      try {
        const senderAddress = await services.getOwnerAddress();
        const txHash = await services.undelegateResource(
          {
            amount,
            receiverAddress,
            resource: resource as "BANDWIDTH" | "ENERGY",
          },
          network,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  to: receiverAddress,
                  amount,
                  resource,
                  txHash,
                  message:
                    "Undelegate resource transaction sent. This revokes previously delegated resources.",
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
              text: `Error undelegating resource: ${error instanceof Error ? error.message : String(
                error,
              )}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_can_delegated_max_size",
    {
      description:
        "Get the maximum amount of TRX (in Sun) that an address can currently delegate as resources (BANDWIDTH or ENERGY) under Stake 2.0.",
      inputSchema: {
        address: z.string().describe("Wallet address (Base58 or hex)"),
        resource: z
          .enum(["BANDWIDTH", "ENERGY"])
          .describe("Resource type to query (BANDWIDTH or ENERGY)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Can Delegated Max Size",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address, resource, network = "mainnet" }) => {
      try {
        const result = await services.getCanDelegatedMaxSize(
          address,
          resource as "BANDWIDTH" | "ENERGY",
          network,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  address: result.address,
                  resource: result.resource,
                  maxSizeSun: result.maxSizeSun.toString(),
                  message:
                    "This is the maximum amount (in Sun) that can currently be delegated as the specified resource.",
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
              text: `Error getting can delegated max size: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_delegated_resource_v2",
    {
      description:
        "Get delegated resource details (bandwidth and energy) between two addresses under Stake 2.0.",
      inputSchema: {
        fromAddress: z.string().describe("Delegator address (Base58 or hex)"),
        toAddress: z.string().describe("Delegatee address (Base58 or hex)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Delegated Resource V2",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ fromAddress, toAddress, network = "mainnet" }) => {
      try {
        const result = await services.getDelegatedResourceV2(fromAddress, toAddress, network);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: result.from,
                  to: result.to,
                  delegatedResource: result.delegatedResource,
                  message:
                    "Delegated resource details between the two addresses, including bandwidth and energy stake information.",
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
              text: `Error getting delegated resource v2: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_delegated_resource_account_index_v2",
    {
      description:
        "Get delegated resource account index for an address under Stake 2.0 (who delegated to this address and who this address delegated to).",
      inputSchema: {
        address: z.string().describe("Wallet address (Base58 or hex)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Delegated Resource Account Index V2",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address, network = "mainnet" }) => {
      try {
        const result = await services.getDelegatedResourceAccountIndexV2(address, network);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  account: result.account,
                  fromAccounts: result.fromAccounts,
                  toAccounts: result.toAccounts,
                  message:
                    "Delegated resource account index for the address, including who delegated to it and who it delegated to.",
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
              text: `Error getting delegated resource account index v2: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}

