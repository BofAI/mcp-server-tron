import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerContractTools(registerTool: RegisterToolFn) {
  registerTool(
    "read_contract",
    {
      description: "Call read-only functions on a smart contract.",
      inputSchema: {
        contractAddress: z.string().describe("The contract address"),
        functionName: z.string().describe("Function name (e.g., 'name', 'symbol', 'balanceOf')"),
        args: z
          .array(
            z.union([
              z.string(),
              z.number(),
              z.boolean(),
              z.array(z.string()), // String array
              z.array(z.number()), // Number array
              z.record(z.unknown()), // Object (tuple)
            ]),
          )
          .optional()
          .describe("Function arguments (supports arrays and objects for complex types)"),
        abi: z
          .array(z.record(z.unknown()))
          .optional()
          .describe(
            "Optional contract ABI array. If not provided, will fetch from chain. Use for contracts with incomplete on-chain ABI.",
          ),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Read Smart Contract",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ contractAddress, functionName, args = [], abi, network = "mainnet" }) => {
      try {
        const result = await services.readContract(
          {
            address: contractAddress,
            functionName,
            args,
            abi,
          },
          network,
        );

        return {
          content: [
            {
              type: "text",
              text: services.helpers.formatJson({
                contractAddress,
                function: functionName,
                args: args.length > 0 ? args : undefined,
                result,
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error reading contract: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Raw contract metadata helpers
  registerTool(
    "get_contract",
    {
      description:
        "Get raw contract metadata from the chain, including ABI (if verified) and bytecode.",
      inputSchema: {
        contractAddress: z.string().describe("The contract address"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Contract",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ contractAddress, network = "mainnet" }) => {
      try {
        const contract = await services.getContract(contractAddress, network);
        return {
          content: [
            {
              type: "text",
              text: services.helpers.formatJson({
                network,
                contractAddress,
                contract,
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting contract: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "get_contract_info",
    {
      description:
        "Get high-level information about a contract: ABI, readable function signatures, and raw metadata.",
      inputSchema: {
        contractAddress: z.string().describe("The contract address"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Contract Info",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ contractAddress, network = "mainnet" }) => {
      try {
        const info = await services.getContractInfo(contractAddress, network);
        return {
          content: [
            {
              type: "text",
              text: services.helpers.formatJson(info),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting contract info: ${error instanceof Error ? error.message : String(
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
    "fetch_contract_abi",
    {
      description:
        "Fetch contract ABI from the chain (for verified contracts). Returns the ABI entry array.",
      inputSchema: {
        contractAddress: z.string().describe("The contract address"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Fetch Contract ABI",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ contractAddress, network = "mainnet" }) => {
      try {
        const abi = await services.fetchContractABI(contractAddress, network);
        return {
          content: [
            {
              type: "text",
              text: services.helpers.formatJson({
                network,
                contractAddress,
                abi,
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching contract ABI: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "multicall",
    {
      description: "Execute multiple read-only functions in a single batch call.",
      inputSchema: {
        calls: z
          .array(
            z.object({
              address: z.string().describe("Target contract address"),
              functionName: z.string().describe("Function name"),
              args: z
                .array(
                  z.union([
                    z.string(),
                    z.number(),
                    z.boolean(),
                    z.array(z.string()), // String array
                    z.array(z.number()), // Number array
                    z.record(z.unknown()), // Object (tuple)
                  ]),
                )
                .optional()
                .describe("Function arguments (supports arrays and objects for complex types)"),
              abi: z.array(z.record(z.unknown())).describe("Function ABI (required for multicall)"),
              allowFailure: z
                .boolean()
                .optional()
                .describe("Whether to allow this specific call to fail"),
            }),
          )
          .describe("Array of calls to execute"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
        multicallAddress: z
          .string()
          .optional()
          .describe("Optional Multicall contract address override"),
        version: z
          .enum(["2", "3"])
          .optional()
          .describe("Multicall version (2 or 3). Defaults to 3."),
        allowFailure: z
          .boolean()
          .optional()
          .describe("Whether to allow individual calls to fail. Defaults to true."),
      },
      annotations: {
        title: "Multicall",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({
      calls,
      network = "mainnet",
      multicallAddress,
      version: versionArg,
      allowFailure = true,
    }) => {
      try {
        const version = versionArg ? (parseInt(versionArg) as 2 | 3) : 3;
        const results = await services.multicall(
          {
            calls,
            multicallAddress,
            version: version,
            allowFailure,
          },
          network,
        );

        return {
          content: [
            {
              type: "text",
              text: services.helpers.formatJson({
                network,
                count: calls.length,
                results,
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing multicall: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "write_contract",
    {
      description:
        "Execute state-changing functions on a smart contract. Requires configured wallet.",
      inputSchema: {
        contractAddress: z.string().describe("The contract address"),
        functionName: z.string().describe("Function name to call"),
        args: z
          .array(
            z.union([
              z.string(),
              z.number(),
              z.boolean(),
              z.array(z.string()), // String array
              z.array(z.number()), // Number array
              z.record(z.unknown()), // Object (tuple)
            ]),
          )
          .optional()
          .describe("Function arguments (supports arrays and objects for complex types)"),
        abi: z
          .array(z.record(z.unknown()))
          .optional()
          .describe(
            "Optional contract ABI array. If not provided, will fetch from chain. Use for contracts with incomplete on-chain ABI.",
          ),
        value: z.string().optional().describe("TRX value to send (in Sun)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Write to Smart Contract",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ contractAddress, functionName, args = [], abi, value, network = "mainnet" }) => {
      try {
        const privateKey = services.getConfiguredPrivateKey();
        const senderAddress = services.getWalletAddressFromKey();

        const txHash = await services.writeContract(
          privateKey,
          {
            address: contractAddress,
            functionName,
            args,
            abi,
            value,
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
                  contractAddress,
                  function: functionName,
                  args: args.length > 0 ? args : undefined,
                  value: value || undefined,
                  from: senderAddress,
                  txHash,
                  message: "Transaction sent. Use get_transaction_info to check confirmation.",
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
              text: `Error writing to contract: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "deploy_contract",
    {
      description: "Deploy a smart contract to the TRON network using ABI and Bytecode.",
      inputSchema: {
        abi: z.array(z.record(z.unknown())).describe("The contract ABI (array of objects)"),
        bytecode: z.string().describe("The compiled contract bytecode (hex string)"),
        args: z
          .array(
            z.union([
              z.string(),
              z.number(),
              z.boolean(),
              z.array(z.string()), // String array
              z.array(z.number()), // Number array
              z.record(z.unknown()), // Object (tuple)
            ]),
          )
          .optional()
          .describe("Constructor arguments"),
        name: z.string().optional().describe("Contract name (optional)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
        feeLimit: z
          .number()
          .optional()
          .describe("Fee limit in Sun (default: 1,000,000,000 = 1000 TRX)"),
      },
      annotations: {
        title: "Deploy Smart Contract",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ abi, bytecode, args = [], name, network = "mainnet", feeLimit }) => {
      try {
        const privateKey = services.getConfiguredPrivateKey();
        const senderAddress = services.getWalletAddressFromKey();

        const result = await services.deployContract(
          privateKey,
          {
            abi,
            bytecode,
            args,
            name,
            feeLimit,
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
                  constructorArgs: args.length > 0 ? args : undefined,
                  ...result, // result contains contractAddress, txHash, message, etc.
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error deploying contract: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "estimate_energy",
    {
      description: "Estimate energy consumption for a smart contract call (simulation).",
      inputSchema: {
        address: z.string().describe("Contract address"),
        functionName: z.string().describe("Function name to call"),
        args: z.array(z.unknown()).optional().describe("Function arguments"),
        abi: z.array(z.object({}).passthrough()).describe("Contract ABI (required for encoding)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
        ownerAddress: z
          .string()
          .optional()
          .describe("Caller address for simulation. Defaults to configured wallet."),
      },
      annotations: {
        title: "Estimate Energy",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address, functionName, args = [], abi, network = "mainnet", ownerAddress }) => {
      try {
        const result = await services.estimateEnergy(
          {
            address,
            functionName,
            args,
            abi,
            ownerAddress,
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
                  address,
                  functionName,
                  ...result,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error estimating energy: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Contract admin / configuration helpers
  registerTool(
    "update_contract_setting",
    {
      description:
        "Update a contract's consume_user_resource_percent (user pay ratio). Requires the contract creator's wallet.",
      inputSchema: {
        contractAddress: z.string().describe("The contract address"),
        consumeUserResourcePercent: z
          .number()
          .describe("New consume_user_resource_percent value (0-100)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Update Contract Setting",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ contractAddress, consumeUserResourcePercent, network = "mainnet" }) => {
      try {
        const privateKey = services.getConfiguredPrivateKey();
        const senderAddress = services.getWalletAddressFromKey();
        const txHash = await services.updateSetting(
          privateKey,
          contractAddress,
          consumeUserResourcePercent,
          network,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  contractAddress,
                  from: senderAddress,
                  consumeUserResourcePercent,
                  txHash,
                  message:
                    "Contract setting updated. This changes the user pay ratio for contract execution.",
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
              text: `Error updating contract setting: ${
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
    "update_energy_limit",
    {
      description:
        "Update a contract's originEnergyLimit (max energy the contract creator will pay per execution). Requires the contract creator's wallet.",
      inputSchema: {
        contractAddress: z.string().describe("The contract address"),
        originEnergyLimit: z
          .number()
          .describe("New originEnergyLimit value (energy units, must be > 0)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Update Energy Limit",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ contractAddress, originEnergyLimit, network = "mainnet" }) => {
      try {
        const privateKey = services.getConfiguredPrivateKey();
        const senderAddress = services.getWalletAddressFromKey();
        const txHash = await services.updateEnergyLimit(
          privateKey,
          contractAddress,
          originEnergyLimit,
          network,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  contractAddress,
                  from: senderAddress,
                  originEnergyLimit,
                  txHash,
                  message:
                    "Contract energy limit updated. This changes the maximum energy the contract creator will pay per execution.",
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
              text: `Error updating energy limit: ${
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
    "clear_abi",
    {
      description:
        "Clear the on-chain ABI metadata of a contract (ClearABIContract). Requires the contract creator's wallet.",
      inputSchema: {
        contractAddress: z.string().describe("The contract address whose ABI will be cleared"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Clear Contract ABI",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ contractAddress, network = "mainnet" }) => {
      try {
        const privateKey = services.getConfiguredPrivateKey();
        const senderAddress = services.getWalletAddressFromKey();
        const txHash = await services.clearABI(privateKey, contractAddress, network);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  contractAddress,
                  from: senderAddress,
                  txHash,
                  message:
                    "Contract ABI cleared on-chain. This removes ABI metadata from the contract.",
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
              text: `Error clearing contract ABI: ${
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
