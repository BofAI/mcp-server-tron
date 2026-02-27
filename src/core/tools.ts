import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSupportedNetworks, getRpcUrl } from "./chains.js";
import * as services from "./services/index.js";

/**
 * Register all TRON-related tools with the MCP server
 *
 * SECURITY: Either TRON_PRIVATE_KEY or TRON_MNEMONIC environment variable must be set for write operations.
 * Private keys and mnemonics are never passed as tool arguments for security reasons.
 * Tools will use the configured wallet for all transactions.
 *
 * Configuration options:
 * - TRON_PRIVATE_KEY: Hex private key (with or without 0x prefix)
 * - TRON_MNEMONIC: BIP-39 mnemonic phrase (12 or 24 words)
 * - TRON_ACCOUNT_INDEX: Optional account index for HD wallet derivation (default: 0)
 *
 * @param server The MCP server instance
 */
export function registerTRONTools(server: McpServer) {
  // Helpers are now imported from services/wallet.ts
  const { getConfiguredPrivateKey, getWalletAddressFromKey } = services;

  // ============================================================================
  // WALLET INFORMATION TOOLS (Read-only)
  // ============================================================================

  server.registerTool(
    "get_wallet_address",
    {
      description:
        "Get the address of the configured wallet. Use this to verify which wallet is active.",
      inputSchema: {},
      annotations: {
        title: "Get Wallet Address",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const address = getWalletAddressFromKey();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  address,
                  base58: services.toBase58Address(address),
                  hex: services.toHexAddress(address),
                  message: "This is the wallet that will be used for all transactions",
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
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ============================================================================
  // NETWORK INFORMATION TOOLS (Read-only)
  // ============================================================================

  server.registerTool(
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

  server.registerTool(
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

  server.registerTool(
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
        const tronWeb = services.getTronWeb(network);
        const parameters = await tronWeb.trx.getChainParameters();

        const paramMap = new Map<string, number | undefined>();
        for (const param of parameters) {
          if (param.key) {
            paramMap.set(param.key, param.value);
          }
        }

        const result = {
          network,
          energy_price_sun: paramMap.get("getEnergyFee"), // Energy unit price (sun per unit)
          bandwidth_price_sun: paramMap.get("getTransactionFee"), // Bandwidth unit price (sun per byte)
          all_parameters: parameters,
        };

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

  // ============================================================================
  // ADDRESS TOOLS (Read-only)
  // ============================================================================

  server.registerTool(
    "convert_address",
    {
      description: "Convert addresses between Hex and Base58 formats",
      inputSchema: {
        address: z.string().describe("Address to convert (Hex or Base58)"),
      },
      annotations: {
        title: "Convert Address",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address }) => {
      try {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  original: address,
                  base58: services.toBase58Address(address),
                  hex: services.toHexAddress(address),
                  isValid: services.utils.isAddress(address),
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
              text: `Error converting address: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ============================================================================
  // BLOCK TOOLS (Read-only)
  // ============================================================================

  server.registerTool(
    "get_block",
    {
      description: "Get block details by block number or hash",
      inputSchema: {
        blockIdentifier: z.string().describe("Block number (as string) or block hash"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Block",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ blockIdentifier, network = "mainnet" }) => {
      try {
        let block;
        // Check if it's a hash (hex string usually 64 chars + prefix) or number
        if (
          blockIdentifier.startsWith("0x") ||
          (blockIdentifier.length > 20 && isNaN(Number(blockIdentifier)))
        ) {
          // Assume hash
          block = await services.getBlockByHash(blockIdentifier, network);
        } else {
          // Assume number
          block = await services.getBlockByNumber(parseInt(blockIdentifier), network);
        }
        return { content: [{ type: "text", text: services.helpers.formatJson(block) }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching block: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "get_latest_block",
    {
      description: "Get the latest block from the network",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Latest Block",
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
              text: `Error fetching latest block: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ============================================================================
  // BALANCE TOOLS (Read-only)
  // ============================================================================

  server.registerTool(
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

  server.registerTool(
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

  // ============================================================================
  // TRANSACTION TOOLS (Read-only)
  // ============================================================================

  server.registerTool(
    "get_transaction",
    {
      description: "Get transaction details by transaction hash",
      inputSchema: {
        txHash: z.string().describe("Transaction hash"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Transaction",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ txHash, network = "mainnet" }) => {
      try {
        const tx = await services.getTransaction(txHash, network);
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

  server.registerTool(
    "get_transaction_info",
    {
      description: "Get transaction info (receipt/confirmation status, energy usage, logs).",
      inputSchema: {
        txHash: z.string().describe("Transaction hash"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Get Transaction Info",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ txHash, network = "mainnet" }) => {
      try {
        const info = await services.getTransactionInfo(txHash, network);
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

  // ============================================================================
  // SMART CONTRACT TOOLS
  // ============================================================================

  server.registerTool(
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

  server.registerTool(
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

  server.registerTool(
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
        const privateKey = getConfiguredPrivateKey();
        const senderAddress = getWalletAddressFromKey();

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

  server.registerTool(
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
        const privateKey = getConfiguredPrivateKey();
        const senderAddress = getWalletAddressFromKey();

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

  server.registerTool(
    "estimate_energy",
    {
      description: "Estimate energy consumption for a smart contract call (simulation).",
      inputSchema: {
        address: z.string().describe("Contract address"),
        functionName: z.string().describe("Function name to call"),
        args: z.array(z.any()).optional().describe("Function arguments"),
        abi: z.array(z.any()).describe("Contract ABI (required for encoding)"),
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

  // ============================================================================
  // TRANSFER TOOLS (Write operations)
  // ============================================================================

  server.registerTool(
    "transfer_trx",
    {
      description: "Transfer TRX to an address.",
      inputSchema: {
        to: z.string().describe("Recipient address"),
        amount: z.string().describe("Amount to send in TRX (e.g., '10.5')"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Transfer TRX",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ to, amount, network = "mainnet" }) => {
      try {
        const privateKey = getConfiguredPrivateKey();
        const senderAddress = getWalletAddressFromKey();
        const txHash = await services.transferTRX(privateKey, to, amount, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  to,
                  amount: `${amount} TRX`,
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
              text: `Error transferring TRX: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "transfer_trc20",
    {
      description: "Transfer TRC20 tokens to an address.",
      inputSchema: {
        tokenAddress: z.string().describe("The TRC20 token contract address"),
        to: z.string().describe("Recipient address"),
        amount: z.string().describe("Amount to send (raw amount with decimals)"),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Transfer TRC20 Tokens",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ tokenAddress, to, amount, network = "mainnet" }) => {
      try {
        const privateKey = getConfiguredPrivateKey();
        const senderAddress = getWalletAddressFromKey();
        const result = await services.transferTRC20(tokenAddress, to, amount, privateKey, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  tokenAddress,
                  from: senderAddress,
                  to,
                  amount: result.amount.formatted,
                  symbol: result.token.symbol,
                  decimals: result.token.decimals,
                  txHash: result.txHash,
                  message: "Transaction sent.",
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
              text: `Error transferring TRC20 tokens: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ============================================================================
  // STAKING TOOLS (Stake 2.0)
  // ============================================================================

  server.registerTool(
    "freeze_balance_v2",
    {
      description: "Freeze TRX to get resources (Stake 2.0).",
      inputSchema: {
        amount: z.string().describe("Amount to freeze in Sun (1 TRX = 1,000,000 Sun)"),
        resource: z
          .enum(["BANDWIDTH", "ENERGY"])
          .optional()
          .describe("Resource type to get. Defaults to BANDWIDTH."),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Freeze Balance V2",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ amount, resource = "BANDWIDTH", network = "mainnet" }) => {
      try {
        const privateKey = getConfiguredPrivateKey();
        const senderAddress = getWalletAddressFromKey();
        const txHash = await services.freezeBalanceV2(
          privateKey,
          amount,
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
                  from: senderAddress,
                  amount: `${services.utils.fromSun(amount)} TRX`,
                  resource,
                  txHash,
                  message: "Freeze transaction sent.",
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
              text: `Error freezing balance: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "unfreeze_balance_v2",
    {
      description: "Unfreeze TRX to release resources (Stake 2.0).",
      inputSchema: {
        amount: z.string().describe("Amount to unfreeze in Sun (1 TRX = 1,000,000 Sun)"),
        resource: z
          .enum(["BANDWIDTH", "ENERGY"])
          .optional()
          .describe("Resource type to release. Defaults to BANDWIDTH."),
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Unfreeze Balance V2",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ amount, resource = "BANDWIDTH", network = "mainnet" }) => {
      try {
        const privateKey = getConfiguredPrivateKey();
        const senderAddress = getWalletAddressFromKey();
        const txHash = await services.unfreezeBalanceV2(
          privateKey,
          amount,
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
                  from: senderAddress,
                  amount: `${services.utils.fromSun(amount)} TRX`,
                  resource,
                  txHash,
                  message: "Unfreeze transaction sent.",
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
              text: `Error unfreezing balance: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "withdraw_expire_unfreeze",
    {
      description:
        "Withdraw expired unfrozen balance (Stake 2.0). Call this after the unfreezing period to return TRX to available balance.",
      inputSchema: {
        network: z.string().optional().describe("Network name. Defaults to mainnet."),
      },
      annotations: {
        title: "Withdraw Expired Unfrozen Balance",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ network = "mainnet" }) => {
      try {
        const privateKey = getConfiguredPrivateKey();
        const senderAddress = getWalletAddressFromKey();
        const txHash = await services.withdrawExpireUnfreeze(privateKey, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  network,
                  from: senderAddress,
                  txHash,
                  message: "Withdrawal transaction sent.",
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

  // ============================================================================
  // MESSAGE SIGNING TOOLS (Write operations)
  // ============================================================================

  server.registerTool(
    "sign_message",
    {
      description: "Sign an arbitrary message using the configured wallet.",
      inputSchema: {
        message: z.string().describe("The message to sign"),
      },
      annotations: {
        title: "Sign Message",
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ message }) => {
      try {
        const senderAddress = getWalletAddressFromKey();
        const signature = await services.signMessage(message);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  message,
                  signature,
                  signer: senderAddress,
                  messageType: "personal_sign",
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
              text: `Error signing message: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
