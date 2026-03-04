import { describe, it, expect, beforeEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTRONTools } from "../../src/core/tools/index";
import * as services from "../../src/core/services/index";

// Mock all services
vi.mock("../../src/core/services/index", async () => {
  const actual = await vi.importActual("../../src/core/services/index");
  return {
    ...(actual as any),
    getWalletAddressFromKey: vi.fn(),
    getConfiguredPrivateKey: vi.fn(),
    isWalletConfigured: vi.fn(),
    getChainId: vi.fn(),
    getBlockNumber: vi.fn(),
    getTRXBalance: vi.fn(),
    getTRC20Balance: vi.fn(),
    readContract: vi.fn(),
    multicall: vi.fn(),
    writeContract: vi.fn(),
    transferTRX: vi.fn(),
    transferTRC20: vi.fn(),
    signMessage: vi.fn(),
    getBlockByHash: vi.fn(),
    getBlockByNumber: vi.fn(),
    getLatestBlock: vi.fn(),
    getTransaction: vi.fn(),
    getTransactionInfo: vi.fn(),
    deployContract: vi.fn(),
    getContract: vi.fn(),
    getContractInfo: vi.fn(),
    fetchContractABI: vi.fn(),
    updateSetting: vi.fn(),
    updateEnergyLimit: vi.fn(),
    clearABI: vi.fn(),
    delegateResource: vi.fn(),
    undelegateResource: vi.fn(),
    estimateEnergy: vi.fn(),
    freezeBalanceV2: vi.fn(),
    unfreezeBalanceV2: vi.fn(),
    withdrawExpireUnfreeze: vi.fn(),
    cancelAllUnfreezeV2: vi.fn(),
    getAvailableUnfreezeCount: vi.fn(),
    getCanWithdrawUnfreezeAmount: vi.fn(),
    getCanDelegatedMaxSize: vi.fn(),
    getDelegatedResourceV2: vi.fn(),
    getDelegatedResourceAccountIndexV2: vi.fn(),
    listNodes: vi.fn(),
    getNodeInfo: vi.fn(),
    getTransactionListFromPending: vi.fn(),
    getTransactionFromPending: vi.fn(),
    getPendingSize: vi.fn(),
    getEventsByTransactionId: vi.fn(),
    getEventsByContractAddress: vi.fn(),
    getEventsByBlockNumber: vi.fn(),
    getEventsOfLatestBlock: vi.fn(),
    getAccount: vi.fn(),
    getAccountBalance: vi.fn(),
    generateAccount: vi.fn(),
    validateAddress: vi.fn(),
    getAccountNet: vi.fn(),
    getAccountResource: vi.fn(),
    getDelegatedResource: vi.fn(),
    getDelegatedResourceIndex: vi.fn(),
    createAccount: vi.fn(),
    updateAccount: vi.fn(),
    updateAccountPermissions: vi.fn(),
    // Governance
    listWitnesses: vi.fn(),
    getPaginatedWitnessList: vi.fn(),
    getNextMaintenanceTime: vi.fn(),
    getReward: vi.fn(),
    getBrokerage: vi.fn(),
    createWitness: vi.fn(),
    updateWitness: vi.fn(),
    voteWitness: vi.fn(),
    withdrawBalance: vi.fn(),
    updateBrokerage: vi.fn(),
    // Proposals
    listProposals: vi.fn(),
    getProposalById: vi.fn(),
    createProposal: vi.fn(),
    approveProposal: vi.fn(),
    deleteProposal: vi.fn(),
    getBlockByLatestNum: vi.fn(),
    getBlockByLimitNext: vi.fn(),
    getTransactionInfoByBlockNum: vi.fn(),
    getEnergyPrices: vi.fn(),
    getBandwidthPrices: vi.fn(),
    getBurnTrx: vi.fn(),
    getApprovedList: vi.fn(),
    getBlockBalance: vi.fn(),
    broadcastTransaction: vi.fn(),
    broadcastHex: vi.fn(),
    createTransaction: vi.fn(),
    // TronGrid data tools
    getAccountInfo: vi.fn(),
    getAccountTransactions: vi.fn(),
    getAccountTrc20Transactions: vi.fn(),
    getAccountInternalTransactions: vi.fn(),
    getAccountTrc20Balances: vi.fn(),
    getContractTransactions: vi.fn(),
    getContractInternalTransactions: vi.fn(),
    getTrc20TokenHolders: vi.fn(),
  };
});

describe("TRON Tools Unit Tests", () => {
  let server: McpServer;
  let registeredTools: Map<string, any>;

  beforeEach(() => {
    server = new McpServer({
      name: "test-server",
      version: "1.0.0",
    });

    // Track registered tools
    registeredTools = new Map();
    const originalRegisterTool = server.registerTool.bind(server);
    server.registerTool = (name: string, schema: any, handler: any) => {
      registeredTools.set(name, { schema, handler });
      return originalRegisterTool(name, schema, handler);
    };

    (services.isWalletConfigured as any).mockReturnValue(true);
    registerTRONTools(server);
    vi.clearAllMocks();
  });

  describe("Registration", () => {
    it("should register at least all expected TRON tools", () => {
      // already registered in beforeEach with isWalletConfigured=true
      const expectedTools = [
        "get_wallet_address",
        "get_chain_info",
        "get_supported_networks",
        "get_chain_parameters",
        "convert_address",
        "get_block",
        "get_latest_block",
        "get_balance",
        "get_token_balance",
        "get_transaction",
        "get_transaction_info",
        "read_contract",
        "get_contract",
        "get_contract_info",
        "fetch_contract_abi",
        "multicall",
        "update_contract_setting",
        "update_energy_limit",
        "clear_abi",
        "estimate_energy",
        "delegate_resource",
        "undelegate_resource",
        "write_contract",
        "transfer_trx",
        "transfer_trc20",
        "sign_message",
        "deploy_contract",
        "freeze_balance_v2",
        "unfreeze_balance_v2",
        "withdraw_expire_unfreeze",
        "cancel_all_unfreeze_v2",
        "get_available_unfreeze_count",
        "get_can_withdraw_unfreeze_amount",
        "get_can_delegated_max_size",
        "get_delegated_resource_v2",
        "get_delegated_resource_account_index_v2",
        // Additional block & transaction tools
        "get_block_by_num",
        "get_block_by_id",
        "get_block_by_latest_num",
        "get_block_by_limit_next",
        "get_now_block",
        "get_transaction_by_id",
        "get_transaction_info_by_id",
        "get_transaction_info_by_block_num",
        "get_energy_prices",
        "get_bandwidth_prices",
        "get_burn_trx",
        "get_approved_list",
        "get_block_balance",
        "broadcast_transaction",
        "broadcast_hex",
        "create_transaction",
        // Node & mempool
        "list_nodes",
        "get_node_info",
        "get_pending_transactions",
        "get_transaction_from_pending",
        "get_pending_size",
        // Event tools
        "get_events_by_transaction_id",
        "get_events_by_contract_address",
        "get_events_by_block_number",
        "get_events_of_latest_block",
        // Account tools
        "get_account",
        "get_account_balance",
        "generate_account",
        "validate_address",
        "get_account_net",
        "get_account_resource",
        "get_delegated_resource",
        "get_delegated_resource_index",
        "create_account",
        "update_account",
        "account_permission_update",
        // Governance
        "list_witnesses",
        "get_paginated_witnesses",
        "get_next_maintenance_time",
        "get_reward",
        "get_brokerage",
        "create_witness",
        "update_witness",
        "vote_witness",
        "withdraw_balance",
        "update_brokerage",
        // Proposals
        "list_proposals",
        "get_proposal",
        "create_proposal",
        "approve_proposal",
        "delete_proposal",
        // TronGrid data tools
        "get_account_info",
        "get_account_transactions",
        "get_account_trc20_transactions",
        "get_account_internal_transactions",
        "get_account_trc20_balances",
        "get_contract_transactions",
        "get_contract_internal_transactions",
        "get_trc20_token_holders",
      ];
      expectedTools.forEach((tool) => {
        expect(registeredTools.has(tool)).toBe(true);
      });

      expect(registeredTools.size).toBeGreaterThanOrEqual(expectedTools.length);
    });

    it("should NOT register write tools when readOnly option is true", () => {
      registeredTools = new Map();
      const localServer = new McpServer({ name: "test", version: "1" });
      const originalRegisterTool = localServer.registerTool.bind(localServer);
      localServer.registerTool = (name: string, schema: any, handler: any) => {
        registeredTools.set(name, { schema, handler });
        return originalRegisterTool(name, schema, handler);
      };

      (services.isWalletConfigured as any).mockReturnValue(true);
      registerTRONTools(localServer, { readOnly: true });

      // Write tools should NOT be registered
      expect(registeredTools.has("transfer_trx")).toBe(false);
      expect(registeredTools.has("write_contract")).toBe(false);
      expect(registeredTools.has("create_account")).toBe(false);
      expect(registeredTools.has("update_account")).toBe(false);
      expect(registeredTools.has("account_permission_update")).toBe(false);
      expect(registeredTools.has("broadcast_transaction")).toBe(false);
      expect(registeredTools.has("broadcast_hex")).toBe(false);
      expect(registeredTools.has("create_transaction")).toBe(false);
      expect(registeredTools.has("freeze_balance_v2")).toBe(false);
      expect(registeredTools.has("unfreeze_balance_v2")).toBe(false);
      expect(registeredTools.has("withdraw_expire_unfreeze")).toBe(false);
      expect(registeredTools.has("cancel_all_unfreeze_v2")).toBe(false);
      expect(registeredTools.has("delegate_resource")).toBe(false);
      expect(registeredTools.has("undelegate_resource")).toBe(false);

      // Governance/proposal write tools should NOT be registered
      expect(registeredTools.has("create_witness")).toBe(false);
      expect(registeredTools.has("update_witness")).toBe(false);
      expect(registeredTools.has("vote_witness")).toBe(false);
      expect(registeredTools.has("withdraw_balance")).toBe(false);
      expect(registeredTools.has("update_brokerage")).toBe(false);
      expect(registeredTools.has("create_proposal")).toBe(false);
      expect(registeredTools.has("approve_proposal")).toBe(false);
      expect(registeredTools.has("delete_proposal")).toBe(false);

      // get_wallet_address IS a read tool (readOnlyHint: true)
      // Since isWalletConfigured is mocked to true, it SHOULD be registered
      // even in readonly mode because it doesn't perform write operations.
      expect(registeredTools.has("get_wallet_address")).toBe(true);

      // Read tools should STILL be registered
      expect(registeredTools.has("get_balance")).toBe(true);
      expect(registeredTools.has("get_chain_info")).toBe(true);

      // Governance/proposal read tools should STILL be registered
      expect(registeredTools.has("list_witnesses")).toBe(true);
      expect(registeredTools.has("get_paginated_witnesses")).toBe(true);
      expect(registeredTools.has("get_next_maintenance_time")).toBe(true);
      expect(registeredTools.has("get_reward")).toBe(true);
      expect(registeredTools.has("get_brokerage")).toBe(true);
      expect(registeredTools.has("list_proposals")).toBe(true);
      expect(registeredTools.has("get_proposal")).toBe(true);
    });

    it("should NOT register wallet-dependent or write tools when no wallet is configured", () => {
      registeredTools = new Map();
      const localServer = new McpServer({ name: "test", version: "1" });
      const originalRegisterTool = localServer.registerTool.bind(localServer);
      localServer.registerTool = (name: string, schema: any, handler: any) => {
        registeredTools.set(name, { schema, handler });
        return originalRegisterTool(name, schema, handler);
      };

      (services.isWalletConfigured as any).mockReturnValue(false);
      registerTRONTools(localServer);

      // Write tools should NOT be registered (no wallet)
      expect(registeredTools.has("transfer_trx")).toBe(false);
      expect(registeredTools.has("transfer_trc20")).toBe(false);
      expect(registeredTools.has("write_contract")).toBe(false);
      expect(registeredTools.has("deploy_contract")).toBe(false);
      expect(registeredTools.has("sign_message")).toBe(false);
      expect(registeredTools.has("freeze_balance_v2")).toBe(false);
      expect(registeredTools.has("unfreeze_balance_v2")).toBe(false);
      expect(registeredTools.has("withdraw_expire_unfreeze")).toBe(false);
      expect(registeredTools.has("cancel_all_unfreeze_v2")).toBe(false);
      expect(registeredTools.has("delegate_resource")).toBe(false);
      expect(registeredTools.has("undelegate_resource")).toBe(false);
      expect(registeredTools.has("create_account")).toBe(false);
      expect(registeredTools.has("update_account")).toBe(false);
      expect(registeredTools.has("account_permission_update")).toBe(false);
      expect(registeredTools.has("broadcast_transaction")).toBe(false);
      expect(registeredTools.has("broadcast_hex")).toBe(false);
      expect(registeredTools.has("create_transaction")).toBe(false);

      // Governance/proposal write tools should NOT be registered (no wallet)
      expect(registeredTools.has("create_witness")).toBe(false);
      expect(registeredTools.has("update_witness")).toBe(false);
      expect(registeredTools.has("vote_witness")).toBe(false);
      expect(registeredTools.has("withdraw_balance")).toBe(false);
      expect(registeredTools.has("update_brokerage")).toBe(false);
      expect(registeredTools.has("create_proposal")).toBe(false);
      expect(registeredTools.has("approve_proposal")).toBe(false);
      expect(registeredTools.has("delete_proposal")).toBe(false);

      // get_wallet_address has requiresWallet: true, should be hidden
      expect(registeredTools.has("get_wallet_address")).toBe(false);

      // Pure read tools should STILL be registered
      expect(registeredTools.has("get_balance")).toBe(true);
      expect(registeredTools.has("get_chain_info")).toBe(true);
      expect(registeredTools.has("get_supported_networks")).toBe(true);
      expect(registeredTools.has("convert_address")).toBe(true);
      expect(registeredTools.has("get_block")).toBe(true);
      expect(registeredTools.has("get_latest_block")).toBe(true);
      expect(registeredTools.has("estimate_energy")).toBe(true);
      expect(registeredTools.has("read_contract")).toBe(true);
      expect(registeredTools.has("multicall")).toBe(true);
      expect(registeredTools.has("list_nodes")).toBe(true);
      expect(registeredTools.has("get_node_info")).toBe(true);
      expect(registeredTools.has("get_pending_transactions")).toBe(true);
      expect(registeredTools.has("get_transaction_from_pending")).toBe(true);
      expect(registeredTools.has("get_pending_size")).toBe(true);
      expect(registeredTools.has("get_events_by_transaction_id")).toBe(true);
      expect(registeredTools.has("get_events_by_contract_address")).toBe(true);
      expect(registeredTools.has("get_events_by_block_number")).toBe(true);
      expect(registeredTools.has("get_events_of_latest_block")).toBe(true);
      expect(registeredTools.has("get_account")).toBe(true);
      expect(registeredTools.has("get_account_balance")).toBe(true);
      expect(registeredTools.has("generate_account")).toBe(true);
      expect(registeredTools.has("validate_address")).toBe(true);
      expect(registeredTools.has("get_account_net")).toBe(true);
      expect(registeredTools.has("get_account_resource")).toBe(true);
      expect(registeredTools.has("get_delegated_resource")).toBe(true);
      expect(registeredTools.has("get_delegated_resource_index")).toBe(true);

      // Governance/proposal read tools should STILL be registered (no wallet needed)
      expect(registeredTools.has("list_witnesses")).toBe(true);
      expect(registeredTools.has("get_paginated_witnesses")).toBe(true);
      expect(registeredTools.has("get_next_maintenance_time")).toBe(true);
      expect(registeredTools.has("get_reward")).toBe(true);
      expect(registeredTools.has("get_brokerage")).toBe(true);
      expect(registeredTools.has("list_proposals")).toBe(true);
      expect(registeredTools.has("get_proposal")).toBe(true);

      // TronGrid data tools (all read-only, no wallet needed)
      expect(registeredTools.has("get_account_info")).toBe(true);
      expect(registeredTools.has("get_account_transactions")).toBe(true);
      expect(registeredTools.has("get_account_trc20_transactions")).toBe(true);
      expect(registeredTools.has("get_account_internal_transactions")).toBe(true);
      expect(registeredTools.has("get_account_trc20_balances")).toBe(true);
      expect(registeredTools.has("get_contract_transactions")).toBe(true);
      expect(registeredTools.has("get_contract_internal_transactions")).toBe(true);
      expect(registeredTools.has("get_trc20_token_holders")).toBe(true);
    });
  });

  describe("Wallet & Address Tools", () => {
    it("get_wallet_address should return configured address", async () => {
      (services.getWalletAddressFromKey as any).mockReturnValue(
        "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
      );
      const result = await registeredTools.get("get_wallet_address").handler({});
      const content = JSON.parse(result.content[0].text);
      expect(content.address).toBe("T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb");
    });

    it("convert_address should handle hex to base58", async () => {
      const hex = "410000000000000000000000000000000000000000";
      const result = await registeredTools.get("convert_address").handler({ address: hex });
      const content = JSON.parse(result.content[0].text);
      expect(content.hex).toBe(hex);
      expect(content.base58).toBe(services.toBase58Address(hex));
    });
  });

  describe("Chain & Network Tools", () => {
    it("get_supported_networks should list networks", async () => {
      const result = await registeredTools.get("get_supported_networks").handler({});
      const content = JSON.parse(result.content[0].text);
      expect(content.supportedNetworks).toContain("mainnet");
    });

    it("get_chain_info should fetch network stats", async () => {
      (services.getChainId as any).mockResolvedValue("0x123");
      (services.getBlockNumber as any).mockResolvedValue(100n);
      const result = await registeredTools.get("get_chain_info").handler({ network: "nile" });
      const content = JSON.parse(result.content[0].text);
      expect(content.chainId).toBe("0x123");
      expect(content.blockNumber).toBe("100");
    });
  });

  describe("Block & Transaction Tools", () => {
    it("get_block should call getBlockByNumber for numeric input", async () => {
      (services.getBlockByNumber as any).mockResolvedValue({ id: "block123" });
      await registeredTools.get("get_block").handler({ blockIdentifier: "123" });
      expect(services.getBlockByNumber).toHaveBeenCalledWith(123, "mainnet");
    });

    it("get_transaction should fetch tx details", async () => {
      (services.getTransaction as any).mockResolvedValue({ txID: "tx123" });
      await registeredTools.get("get_transaction").handler({ txHash: "tx123" });
      expect(services.getTransaction).toHaveBeenCalledWith("tx123", "mainnet");
    });

    it("get_now_block should fetch latest block via getLatestBlock", async () => {
      (services.getLatestBlock as any).mockResolvedValue({ blockID: "b" });
      await registeredTools.get("get_now_block").handler({ network: "nile" });
      expect(services.getLatestBlock).toHaveBeenCalledWith("nile");
    });

    it("get_block_by_latest_num should call getBlockByLatestNum", async () => {
      (services.getBlockByLatestNum as any).mockResolvedValue([{ blockID: "b" }]);
      await registeredTools.get("get_block_by_latest_num").handler({ num: 2, network: "nile" });
      expect(services.getBlockByLatestNum).toHaveBeenCalledWith(2, "nile");
    });

    it("get_transaction_info_by_block_num should call getTransactionInfoByBlockNum", async () => {
      (services.getTransactionInfoByBlockNum as any).mockResolvedValue([{ id: "r" }]);
      await registeredTools.get("get_transaction_info_by_block_num").handler({ num: 123 });
      expect(services.getTransactionInfoByBlockNum).toHaveBeenCalledWith(123, "mainnet");
    });
  });

  describe("Query & Broadcast Tools", () => {
    it("broadcast_hex should call broadcastHex service", async () => {
      (services.broadcastHex as any).mockResolvedValue({ result: true });
      await registeredTools.get("broadcast_hex").handler({ transaction: "0xabc", network: "nile" });
      expect(services.broadcastHex).toHaveBeenCalledWith("0xabc", "nile");
    });

    it("broadcast_transaction should parse JSON and call broadcastTransaction service", async () => {
      (services.broadcastTransaction as any).mockResolvedValue({ result: true });
      const txObj = { txID: "tx123" };
      await registeredTools
        .get("broadcast_transaction")
        .handler({ transaction: JSON.stringify(txObj), network: "nile" });
      expect(services.broadcastTransaction).toHaveBeenCalledWith(txObj, "nile");
    });

    it("create_transaction should call createTransaction service", async () => {
      (services.createTransaction as any).mockResolvedValue({ raw_data: {} });
      await registeredTools.get("create_transaction").handler({
        ownerAddress: "Towner",
        toAddress: "Tto",
        amount: 1,
        network: "nile",
      });
      expect(services.createTransaction).toHaveBeenCalledWith("Towner", "Tto", 1, "nile");
    });
  });

  describe("Balance Tools", () => {
    it("get_balance should fetch TRX balance", async () => {
      (services.getTRXBalance as any).mockResolvedValue({ wei: 1000n, formatted: "0.001" });
      const result = await registeredTools.get("get_balance").handler({ address: "addr" });
      const content = JSON.parse(result.content[0].text);
      expect(content.balance.trx).toBe("0.001");
    });

    it("get_token_balance should fetch TRC20 balance", async () => {
      (services.getTRC20Balance as any).mockResolvedValue({
        raw: 100n,
        formatted: "0.1",
        token: { symbol: "KAI", decimals: 3 },
      });
      const result = await registeredTools.get("get_token_balance").handler({
        address: "addr",
        tokenAddress: "token",
      });
      const content = JSON.parse(result.content[0].text);
      expect(content.balance.symbol).toBe("KAI");
    });
  });

  describe("Smart Contract & Signing Tools", () => {
    it("read_contract should execute view call", async () => {
      (services.readContract as any).mockResolvedValue("result");
      const result = await registeredTools.get("read_contract").handler({
        contractAddress: "addr",
        functionName: "name",
      });
      const content = JSON.parse(result.content[0].text);
      expect(content.result).toContain("result");
    });

    it("get_contract should fetch raw contract metadata", async () => {
      (services.getContract as any).mockResolvedValue({ contract_address: "addr", bytecode: "0x" });
      const result = await registeredTools.get("get_contract").handler({
        contractAddress: "addr",
        network: "nile",
      });
      expect(services.getContract).toHaveBeenCalledWith("addr", "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.contract.contract_address).toBe("addr");
    });

    it("get_contract_info should call getContractInfo service and return ABI/functions", async () => {
      (services.getContractInfo as any).mockResolvedValue({
        address: "addr",
        network: "nile",
        abi: [{ type: "function", name: "balanceOf", inputs: [], outputs: [] }],
        functions: ["balanceOf() -> ()"],
        contract: { contract_address: "addr" },
      });

      const result = await registeredTools.get("get_contract_info").handler({
        contractAddress: "addr",
        network: "nile",
      });

      expect(services.getContractInfo).toHaveBeenCalledWith("addr", "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.address).toBe("addr");
      expect(Array.isArray(content.abi)).toBe(true);
      expect(Array.isArray(content.functions)).toBe(true);
    });

    it("fetch_contract_abi should call fetchContractABI service and return ABI", async () => {
      const mockAbi = [{ type: "function", name: "balanceOf", inputs: [], outputs: [] }];
      (services.fetchContractABI as any).mockResolvedValue(mockAbi);

      const result = await registeredTools.get("fetch_contract_abi").handler({
        contractAddress: "Tcontract",
        network: "nile",
      });

      expect(services.fetchContractABI).toHaveBeenCalledWith("Tcontract", "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.network).toBe("nile");
      expect(content.contractAddress).toBe("Tcontract");
      expect(Array.isArray(content.abi)).toBe(true);
      expect(content.abi).toEqual(mockAbi);
    });

    it("fetch_contract_abi should return error on failure", async () => {
      (services.fetchContractABI as any).mockRejectedValue(new Error("ABI not found"));

      const result = await registeredTools.get("fetch_contract_abi").handler({
        contractAddress: "Tunknown",
        network: "mainnet",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching contract ABI");
    });

    it("multicall should execute batch calls and handle string version", async () => {
      (services.multicall as any).mockResolvedValue([{ success: true, result: "ok" }]);
      const result = await registeredTools.get("multicall").handler({
        calls: [{ address: "a", functionName: "f", abi: [] }],
        version: "2",
      });
      expect(services.multicall).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 2,
        }),
        "mainnet",
      );
      const content = JSON.parse(result.content[0].text);
      expect(content.results[0].result).toBe("ok");
    });

    it("multicall should use default version 3 if not provided", async () => {
      (services.multicall as any).mockResolvedValue([{ success: true, result: "ok" }]);
      await registeredTools.get("multicall").handler({
        calls: [{ address: "a", functionName: "f", abi: [] }],
      });
      expect(services.multicall).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 3,
        }),
        "mainnet",
      );
    });

    it("transfer_trx should send signed transaction", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.transferTRX as any).mockResolvedValue("txhash");
      const result = await registeredTools.get("transfer_trx").handler({ to: "to", amount: "1" });
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("txhash");
    });

    it("sign_message should sign arbitrary text", async () => {
      (services.signMessage as any).mockResolvedValue("sig");
      const result = await registeredTools.get("sign_message").handler({ message: "hi" });
      const content = JSON.parse(result.content[0].text);
      expect(content.signature).toBe("sig");
    });

    it("deploy_contract should call deployContract service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.deployContract as any).mockResolvedValue({
        txID: "tx123",
        contractAddress: "Taddr",
      });

      const result = await registeredTools.get("deploy_contract").handler({
        abi: [],
        bytecode: "0x123",
        network: "nile",
      });

      expect(services.deployContract).toHaveBeenCalledWith(
        "key",
        expect.objectContaining({
          bytecode: "0x123",
        }),
        "nile",
      );
      const content = JSON.parse(result.content[0].text);
      expect(content.txID).toBe("tx123");
      expect(content.contractAddress).toBe("Taddr");
    });

    it("update_contract_setting should call updateSetting service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("Towner");
      (services.updateSetting as any).mockResolvedValue("tx_update");

      const result = await registeredTools.get("update_contract_setting").handler({
        contractAddress: "Tcontract",
        consumeUserResourcePercent: 50,
        network: "nile",
      });

      expect(services.updateSetting).toHaveBeenCalledWith("key", "Tcontract", 50, "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("tx_update");
      expect(content.consumeUserResourcePercent).toBe(50);
    });

    it("update_energy_limit should call updateEnergyLimit service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("Towner");
      (services.updateEnergyLimit as any).mockResolvedValue("tx_energy");

      const result = await registeredTools.get("update_energy_limit").handler({
        contractAddress: "Tcontract",
        originEnergyLimit: 10000000,
        network: "nile",
      });

      expect(services.updateEnergyLimit).toHaveBeenCalledWith(
        "key",
        "Tcontract",
        10000000,
        "nile",
      );
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("tx_energy");
      expect(content.originEnergyLimit).toBe(10000000);
    });

    it("clear_abi should call clearABI service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("Towner");
      (services.clearABI as any).mockResolvedValue("tx_clear");

      const result = await registeredTools.get("clear_abi").handler({
        contractAddress: "Tcontract",
        network: "nile",
      });

      expect(services.clearABI).toHaveBeenCalledWith("key", "Tcontract", "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("tx_clear");
      expect(content.contractAddress).toBe("Tcontract");
    });

    it("delegate_resource should call delegateResource service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("Towner");
      (services.delegateResource as any).mockResolvedValue("tx_delegate");

      const result = await registeredTools.get("delegate_resource").handler({
        receiverAddress: "Treceiver",
        amount: 1000000,
        resource: "ENERGY",
        lock: true,
        lockPeriod: 12345,
        network: "nile",
      });

      expect(services.delegateResource).toHaveBeenCalledWith(
        "key",
        {
          amount: 1000000,
          receiverAddress: "Treceiver",
          resource: "ENERGY",
          lock: true,
          lockPeriod: 12345,
        },
        "nile",
      );

      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("tx_delegate");
      expect(content.to).toBe("Treceiver");
      expect(content.amount).toBe(1000000);
      expect(content.resource).toBe("ENERGY");
      expect(content.lock).toBe(true);
      expect(content.lockPeriod).toBe(12345);
    });

    it("undelegate_resource should call undelegateResource service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("Towner");
      (services.undelegateResource as any).mockResolvedValue("tx_undelegate");

      const result = await registeredTools.get("undelegate_resource").handler({
        receiverAddress: "Treceiver",
        amount: 500000,
        resource: "BANDWIDTH",
        network: "nile",
      });

      expect(services.undelegateResource).toHaveBeenCalledWith(
        "key",
        {
          amount: 500000,
          receiverAddress: "Treceiver",
          resource: "BANDWIDTH",
        },
        "nile",
      );

      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("tx_undelegate");
      expect(content.to).toBe("Treceiver");
      expect(content.amount).toBe(500000);
      expect(content.resource).toBe("BANDWIDTH");
    });

    it("estimate_energy should call estimateEnergy service", async () => {
      (services.estimateEnergy as any).mockResolvedValue({
        energyUsed: 1000,
        energyPenalty: 100,
        totalEnergy: 1100,
      });

      const params = {
        address: "Tcontract",
        functionName: "test",
        abi: [],
        args: [1],
      };

      const result = await registeredTools.get("estimate_energy").handler(params);

      expect(services.estimateEnergy).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "Tcontract",
          functionName: "test",
        }),
        "mainnet",
      );
      const content = JSON.parse(result.content[0].text);
      expect(content.totalEnergy).toBe(1100);
    });
  });

  describe("Staking Tools", () => {
    it("freeze_balance_v2 should call freezeBalanceV2 service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.freezeBalanceV2 as any).mockResolvedValue("tx123");

      const result = await registeredTools.get("freeze_balance_v2").handler({
        amount: "1000000",
        resource: "ENERGY",
      });

      expect(services.freezeBalanceV2).toHaveBeenCalledWith("key", "1000000", "ENERGY", "mainnet");
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("tx123");
    });

    it("unfreeze_balance_v2 should call unfreezeBalanceV2 service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.unfreezeBalanceV2 as any).mockResolvedValue("tx456");

      const result = await registeredTools.get("unfreeze_balance_v2").handler({
        amount: "500000",
        resource: "BANDWIDTH",
        network: "nile",
      });

      expect(services.unfreezeBalanceV2).toHaveBeenCalledWith("key", "500000", "BANDWIDTH", "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("tx456");
    });

    it("withdraw_expire_unfreeze should call withdrawExpireUnfreeze service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.withdrawExpireUnfreeze as any).mockResolvedValue("tx789");

      const result = await registeredTools.get("withdraw_expire_unfreeze").handler({
        network: "nile",
      });

      expect(services.withdrawExpireUnfreeze).toHaveBeenCalledWith("key", "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("tx789");
    });

    it("cancel_all_unfreeze_v2 should call cancelAllUnfreezeV2 service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.cancelAllUnfreezeV2 as any).mockResolvedValue("tx999");

      const result = await registeredTools.get("cancel_all_unfreeze_v2").handler({
        network: "nile",
      });

      expect(services.cancelAllUnfreezeV2).toHaveBeenCalledWith("key", "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("tx999");
    });

    it("get_available_unfreeze_count should call getAvailableUnfreezeCount service", async () => {
      (services.getAvailableUnfreezeCount as any).mockResolvedValue(10);

      const result = await registeredTools.get("get_available_unfreeze_count").handler({
        address: "Taddress",
        network: "nile",
      });

      expect(services.getAvailableUnfreezeCount).toHaveBeenCalledWith("Taddress", "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.availableUnfreezeCount).toBe(10);
    });

    it("get_can_withdraw_unfreeze_amount should call getCanWithdrawUnfreezeAmount service", async () => {
      (services.getCanWithdrawUnfreezeAmount as any).mockResolvedValue({
        amountSun: 1000000n,
        timestampMs: 1700000000000,
      });

      const result = await registeredTools.get("get_can_withdraw_unfreeze_amount").handler({
        address: "Taddress",
        timestampMs: "1700000000000",
        network: "nile",
      });

      expect(services.getCanWithdrawUnfreezeAmount).toHaveBeenCalledWith(
        "Taddress",
        "nile",
        1700000000000,
      );
      const content = JSON.parse(result.content[0].text);
      expect(content.amountSun).toBe("1000000");
      expect(content.amountTrx).toBeDefined();
    });

    it("get_can_delegated_max_size should call getCanDelegatedMaxSize service", async () => {
      (services.getCanDelegatedMaxSize as any).mockResolvedValue({
        address: "Taddress",
        resource: "ENERGY",
        maxSizeSun: 2000000n,
      });

      const result = await registeredTools.get("get_can_delegated_max_size").handler({
        address: "Taddress",
        resource: "ENERGY",
        network: "nile",
      });

      expect(services.getCanDelegatedMaxSize).toHaveBeenCalledWith(
        "Taddress",
        "ENERGY",
        "nile",
      );

      const content = JSON.parse(result.content[0].text);
      expect(content.address).toBe("Taddress");
      expect(content.resource).toBe("ENERGY");
      expect(content.maxSizeSun).toBe("2000000");
    });

    it("get_delegated_resource_v2 should call getDelegatedResourceV2 service", async () => {
      (services.getDelegatedResourceV2 as any).mockResolvedValue({
        from: "Tfrom",
        to: "Tto",
        delegatedResource: [
          {
            from: "Tfrom",
            to: "Tto",
            frozenBalanceForBandwidthSun: "1000000",
            frozenBalanceForEnergySun: "2000000",
            expireTimeForBandwidth: 1700000000000,
            expireTimeForEnergy: 1700000100000,
          },
        ],
      });

      const result = await registeredTools.get("get_delegated_resource_v2").handler({
        fromAddress: "Tfrom",
        toAddress: "Tto",
        network: "nile",
      });

      expect(services.getDelegatedResourceV2).toHaveBeenCalledWith("Tfrom", "Tto", "nile");

      const content = JSON.parse(result.content[0].text);
      expect(content.from).toBe("Tfrom");
      expect(content.to).toBe("Tto");
      expect(Array.isArray(content.delegatedResource)).toBe(true);
      expect(content.delegatedResource[0].frozenBalanceForBandwidthSun).toBe("1000000");
    });

    it("get_delegated_resource_account_index_v2 should call getDelegatedResourceAccountIndexV2 service", async () => {
      (services.getDelegatedResourceAccountIndexV2 as any).mockResolvedValue({
        account: "Taddress",
        fromAccounts: ["Tfrom1", "Tfrom2"],
        toAccounts: ["Tto1"],
      });

      const result = await registeredTools.get("get_delegated_resource_account_index_v2").handler({
        address: "Taddress",
        network: "nile",
      });

      expect(services.getDelegatedResourceAccountIndexV2).toHaveBeenCalledWith("Taddress", "nile");

      const content = JSON.parse(result.content[0].text);
      expect(content.account).toBe("Taddress");
      expect(Array.isArray(content.fromAccounts)).toBe(true);
      expect(content.fromAccounts[0]).toBe("Tfrom1");
    });
  });

  describe("Node Tools", () => {
    it("list_nodes should return node list", async () => {
      (services.listNodes as any).mockResolvedValue(["1.2.3.4:18888", "5.6.7.8:18888"]);
      const result = await registeredTools.get("list_nodes").handler({});
      const content = JSON.parse(result.content[0].text);
      expect(content.nodeCount).toBe(2);
      expect(content.nodes).toEqual(["1.2.3.4:18888", "5.6.7.8:18888"]);
    });

    it("list_nodes should handle errors", async () => {
      (services.listNodes as any).mockRejectedValue(new Error("Network error"));
      const result = await registeredTools.get("list_nodes").handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error listing nodes");
    });

    it("get_node_info should return node information", async () => {
      const mockInfo = { configNodeInfo: {}, machineInfo: {}, activeConnectCount: 5 };
      (services.getNodeInfo as any).mockResolvedValue(mockInfo);
      const result = await registeredTools.get("get_node_info").handler({});
      const content = JSON.parse(result.content[0].text);
      expect(content.activeConnectCount).toBe(5);
    });

    it("get_node_info should handle errors", async () => {
      (services.getNodeInfo as any).mockRejectedValue(new Error("Timeout"));
      const result = await registeredTools.get("get_node_info").handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching node info");
    });
  });

  describe("Mempool Tools", () => {
    it("get_pending_transactions should return transaction list", async () => {
      (services.getTransactionListFromPending as any).mockResolvedValue(["tx1", "tx2"]);
      const result = await registeredTools.get("get_pending_transactions").handler({});
      const content = JSON.parse(result.content[0].text);
      expect(content.pendingCount).toBe(2);
      expect(content.transactionIds).toEqual(["tx1", "tx2"]);
    });

    it("get_pending_transactions should handle errors", async () => {
      (services.getTransactionListFromPending as any).mockRejectedValue(new Error("API error"));
      const result = await registeredTools.get("get_pending_transactions").handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching pending transactions");
    });

    it("get_transaction_from_pending should return transaction details", async () => {
      const mockTx = { txID: "abc123", raw_data: {} };
      (services.getTransactionFromPending as any).mockResolvedValue(mockTx);
      const txId = "a".repeat(64);
      const result = await registeredTools.get("get_transaction_from_pending").handler({ txId });
      const content = JSON.parse(result.content[0].text);
      expect(content.txID).toBe("abc123");
    });

    it("get_transaction_from_pending should handle errors", async () => {
      (services.getTransactionFromPending as any).mockRejectedValue(new Error("Not found"));
      const txId = "b".repeat(64);
      const result = await registeredTools.get("get_transaction_from_pending").handler({ txId });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching transaction from pending");
    });

    it("get_pending_size should return pending pool size", async () => {
      (services.getPendingSize as any).mockResolvedValue(42);
      const result = await registeredTools.get("get_pending_size").handler({});
      const content = JSON.parse(result.content[0].text);
      expect(content.pendingTransactionSize).toBe(42);
    });

    it("get_pending_size should handle errors", async () => {
      (services.getPendingSize as any).mockRejectedValue(new Error("Connection refused"));
      const result = await registeredTools.get("get_pending_size").handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching pending size");
    });
  });

  describe("Event Tools", () => {
    // Mock raw API response structure (before formatEventData transforms it)
    const mockEventResponse = {
      success: true,
      data: [
        {
          event_name: "Transfer",
          event: "Transfer(address,address,uint256)",
          transaction_id: "tx1",
          block_number: 100,
          block_timestamp: 1700000000000,
          contract_address: "TContractAddr",
          caller_contract_address: "",
          _unconfirmed: false,
          result: {
            from: "0x1234567890abcdef1234567890abcdef12345678",
            to: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
            value: "1000000",
          },
          result_type: { from: "address", to: "address", value: "uint256" },
        },
      ],
      meta: { page_size: 1, fingerprint: "page2token" },
    };

    it("get_events_by_transaction_id should return formatted events", async () => {
      (services.getEventsByTransactionId as any).mockResolvedValue(mockEventResponse);
      const result = await registeredTools.get("get_events_by_transaction_id").handler({
        transactionId: "abc123",
      });
      const content = JSON.parse(result.content[0].text);
      expect(content.totalEvents).toBe(1);
      expect(content.events[0].eventName).toBe("Transfer");
      expect(content.events[0].transactionId).toBe("tx1");
      expect(content.events[0].confirmed).toBe(true);
      expect(content.fingerprint).toBe("page2token");
    });

    it("get_events_by_transaction_id should handle errors", async () => {
      (services.getEventsByTransactionId as any).mockRejectedValue(new Error("Not found"));
      const result = await registeredTools.get("get_events_by_transaction_id").handler({
        transactionId: "bad",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching events by transaction");
    });

    it("get_events_by_contract_address should return formatted events", async () => {
      (services.getEventsByContractAddress as any).mockResolvedValue(mockEventResponse);
      const result = await registeredTools.get("get_events_by_contract_address").handler({
        contractAddress: "Taddr",
      });
      const content = JSON.parse(result.content[0].text);
      expect(content.totalEvents).toBe(1);
      expect(content.events[0].eventName).toBe("Transfer");
    });

    it("get_events_by_contract_address should handle errors", async () => {
      (services.getEventsByContractAddress as any).mockRejectedValue(new Error("Invalid address"));
      const result = await registeredTools.get("get_events_by_contract_address").handler({
        contractAddress: "bad",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching events by contract");
    });

    it("get_events_by_block_number should return formatted events", async () => {
      (services.getEventsByBlockNumber as any).mockResolvedValue(mockEventResponse);
      const result = await registeredTools.get("get_events_by_block_number").handler({
        blockNumber: 100,
      });
      const content = JSON.parse(result.content[0].text);
      expect(content.totalEvents).toBe(1);
      expect(content.events[0].blockNumber).toBe(100);
    });

    it("get_events_by_block_number should handle errors", async () => {
      (services.getEventsByBlockNumber as any).mockRejectedValue(new Error("Block not found"));
      const result = await registeredTools.get("get_events_by_block_number").handler({
        blockNumber: -1,
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching events by block");
    });

    it("get_events_of_latest_block should return formatted events", async () => {
      (services.getEventsOfLatestBlock as any).mockResolvedValue(mockEventResponse);
      const result = await registeredTools.get("get_events_of_latest_block").handler({});
      const content = JSON.parse(result.content[0].text);
      expect(content.totalEvents).toBe(1);
      expect(content.events[0].signature).toBe("Transfer(address,address,uint256)");
    });

    it("get_events_of_latest_block should handle errors", async () => {
      (services.getEventsOfLatestBlock as any).mockRejectedValue(new Error("Timeout"));
      const result = await registeredTools.get("get_events_of_latest_block").handler({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching events of latest block");
    });
  });

  describe("Account Data Tools", () => {
    it("get_account_info should return formatted account info", async () => {
      const mockResult = {
        address: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
        balance_trx: "10",
        account_name: "Test",
        trc20_balances: [],
      };
      (services.getAccountInfo as any).mockResolvedValue(mockResult);
      const result = await registeredTools.get("get_account_info").handler({
        address: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
      });
      const content = JSON.parse(result.content[0].text);
      expect(content.address).toBe("T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb");
      expect(content.balance_trx).toBe("10");
    });

    it("get_account_info should handle errors", async () => {
      (services.getAccountInfo as any).mockRejectedValue(new Error("Not found"));
      const result = await registeredTools.get("get_account_info").handler({ address: "bad" });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching account info");
    });

    it("get_account_transactions should return formatted transactions", async () => {
      const mockResult = { transactions: [{ txID: "tx1" }], count: 1 };
      (services.getAccountTransactions as any).mockResolvedValue(mockResult);
      const result = await registeredTools.get("get_account_transactions").handler({
        address: "Taddr",
        limit: 10,
      });
      const content = JSON.parse(result.content[0].text);
      expect(content.count).toBe(1);
      expect(content.transactions[0].txID).toBe("tx1");
    });

    it("get_account_transactions should handle errors", async () => {
      (services.getAccountTransactions as any).mockRejectedValue(new Error("Network error"));
      const result = await registeredTools.get("get_account_transactions").handler({
        address: "bad",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching account transactions");
    });

    it("get_account_trc20_transactions should return formatted TRC20 transactions", async () => {
      const mockResult = { transactions: [{ transaction_id: "trc20tx1" }], count: 1 };
      (services.getAccountTrc20Transactions as any).mockResolvedValue(mockResult);
      const result = await registeredTools.get("get_account_trc20_transactions").handler({
        address: "Taddr",
      });
      const content = JSON.parse(result.content[0].text);
      expect(content.count).toBe(1);
    });

    it("get_account_trc20_transactions should handle errors", async () => {
      (services.getAccountTrc20Transactions as any).mockRejectedValue(new Error("API error"));
      const result = await registeredTools.get("get_account_trc20_transactions").handler({
        address: "bad",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching TRC20 transactions");
    });

    it("get_account_internal_transactions should return formatted internal transactions", async () => {
      const mockResult = { transactions: [{ transaction_id: "itx1" }], count: 1 };
      (services.getAccountInternalTransactions as any).mockResolvedValue(mockResult);
      const result = await registeredTools.get("get_account_internal_transactions").handler({
        address: "Taddr",
      });
      const content = JSON.parse(result.content[0].text);
      expect(content.count).toBe(1);
    });

    it("get_account_internal_transactions should handle errors", async () => {
      (services.getAccountInternalTransactions as any).mockRejectedValue(new Error("Timeout"));
      const result = await registeredTools.get("get_account_internal_transactions").handler({
        address: "bad",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching internal transactions");
    });

    it("get_account_trc20_balances should return balances", async () => {
      const mockResult = {
        balances: [{ address: "Ttoken", balance: "1000" }],
        count: 1,
      };
      (services.getAccountTrc20Balances as any).mockResolvedValue(mockResult);
      const result = await registeredTools.get("get_account_trc20_balances").handler({
        address: "Taddr",
      });
      const content = JSON.parse(result.content[0].text);
      expect(content.count).toBe(1);
      expect(content.balances[0].balance).toBe("1000");
    });

    it("get_account_trc20_balances should handle errors", async () => {
      (services.getAccountTrc20Balances as any).mockRejectedValue(new Error("Failed"));
      const result = await registeredTools.get("get_account_trc20_balances").handler({
        address: "bad",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching TRC20 balances");
    });
  });

  describe("Contract Data Tools", () => {
    it("get_contract_transactions should return formatted transactions", async () => {
      const mockResult = { transactions: [{ txID: "ctx1" }], count: 1 };
      (services.getContractTransactions as any).mockResolvedValue(mockResult);
      const result = await registeredTools.get("get_contract_transactions").handler({
        address: "Tcontract",
      });
      const content = JSON.parse(result.content[0].text);
      expect(content.count).toBe(1);
      expect(content.transactions[0].txID).toBe("ctx1");
    });

    it("get_contract_transactions should handle errors", async () => {
      (services.getContractTransactions as any).mockRejectedValue(new Error("Not found"));
      const result = await registeredTools.get("get_contract_transactions").handler({
        address: "bad",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching contract transactions");
    });

    it("get_contract_internal_transactions should return formatted internal transactions", async () => {
      const mockResult = { transactions: [{ transaction_id: "citx1" }], count: 1 };
      (services.getContractInternalTransactions as any).mockResolvedValue(mockResult);
      const result = await registeredTools.get("get_contract_internal_transactions").handler({
        address: "Tcontract",
      });
      const content = JSON.parse(result.content[0].text);
      expect(content.count).toBe(1);
    });

    it("get_contract_internal_transactions should handle errors", async () => {
      (services.getContractInternalTransactions as any).mockRejectedValue(new Error("Error"));
      const result = await registeredTools.get("get_contract_internal_transactions").handler({
        address: "bad",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching contract internal transactions");
    });

    it("get_trc20_token_holders should return holder list", async () => {
      const mockResult = {
        holders: [{ address: "Tholder", balance: "9999" }],
        count: 1,
      };
      (services.getTrc20TokenHolders as any).mockResolvedValue(mockResult);
      const result = await registeredTools.get("get_trc20_token_holders").handler({
        address: "Ttoken",
      });
      const content = JSON.parse(result.content[0].text);
      expect(content.count).toBe(1);
      expect(content.holders[0].balance).toBe("9999");
    });

    it("get_trc20_token_holders should handle errors", async () => {
      (services.getTrc20TokenHolders as any).mockRejectedValue(new Error("Invalid contract"));
      const result = await registeredTools.get("get_trc20_token_holders").handler({
        address: "bad",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error fetching token holders");
    });
  });

  describe("Account Tools", () => {
    it("get_account should fetch full account info", async () => {
      (services.getAccount as any).mockResolvedValue({
        address: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
        balance: 1000000,
      });
      const result = await registeredTools.get("get_account").handler({
        address: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
        network: "nile",
      });
      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.network).toBe("nile");
      expect(content.balance).toBe(1000000);
    });

    it("get_account_balance should fetch balance at block", async () => {
      (services.getAccountBalance as any).mockResolvedValue({
        balance: 500000,
        block_identifier: { hash: "abc", number: 100 },
      });
      const result = await registeredTools.get("get_account_balance").handler({
        address: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
        blockHash: "abc",
        blockNumber: 100,
      });
      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.balance).toBe(500000);
    });

    it("generate_account should return new keypair", async () => {
      (services.generateAccount as any).mockResolvedValue({
        privateKey: "privkey123",
        publicKey: "pubkey456",
        address: { base58: "Taddr", hex: "41addr" },
      });
      const result = await registeredTools.get("generate_account").handler({});
      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.privateKey).toBe("privkey123");
      expect(content.publicKey).toBe("pubkey456");
    });

    it("validate_address should return validation result", async () => {
      (services.validateAddress as any).mockReturnValue({
        isValid: true,
        address: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
        format: "base58",
      });
      const result = await registeredTools.get("validate_address").handler({
        address: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
      });
      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.isValid).toBe(true);
      expect(content.format).toBe("base58");
    });

    it("get_account_net should fetch bandwidth info", async () => {
      (services.getAccountNet as any).mockResolvedValue({
        address: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
        bandwidth: 5000,
      });
      const result = await registeredTools.get("get_account_net").handler({
        address: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
      });
      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.bandwidth).toBe(5000);
    });

    it("get_account_resource should fetch resource info", async () => {
      (services.getAccountResource as any).mockResolvedValue({
        TotalEnergyLimit: 1000000,
        TotalNetLimit: 500000,
      });
      const result = await registeredTools.get("get_account_resource").handler({
        address: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
        network: "nile",
      });
      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.network).toBe("nile");
      expect(content.TotalEnergyLimit).toBe(1000000);
    });

    it("get_delegated_resource should fetch delegation details", async () => {
      (services.getDelegatedResource as any).mockResolvedValue({
        delegatedResource: [{ frozen_balance_for_energy: 100 }],
      });
      const result = await registeredTools.get("get_delegated_resource").handler({
        fromAddress: "Tfrom",
        toAddress: "Tto",
        network: "nile",
      });
      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.fromAddress).toBe("Tfrom");
      expect(content.toAddress).toBe("Tto");
    });

    it("get_delegated_resource_index should fetch delegation index", async () => {
      (services.getDelegatedResourceIndex as any).mockResolvedValue({
        account: "Taddr",
        toAccounts: ["Tto1"],
      });
      const result = await registeredTools.get("get_delegated_resource_index").handler({
        address: "Taddr",
      });
      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.address).toBe("Taddr");
    });

    it("create_account should activate a new address", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("Tsender");
      (services.createAccount as any).mockResolvedValue("txhash123");
      const result = await registeredTools.get("create_account").handler({
        address: "Tnewaddr",
        network: "nile",
      });
      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("txhash123");
      expect(content.newAccount).toBe("Tnewaddr");
      expect(content.from).toBe("Tsender");
    });

    it("update_account should set account name", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("Tsender");
      (services.updateAccount as any).mockResolvedValue("txhash456");
      const result = await registeredTools.get("update_account").handler({
        accountName: "MyAccount",
        network: "nile",
      });
      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("txhash456");
      expect(content.accountName).toBe("MyAccount");
    });

    it("account_permission_update should update permissions", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("Tsender");
      (services.updateAccountPermissions as any).mockResolvedValue("txhash789");
      const result = await registeredTools.get("account_permission_update").handler({
        ownerPermission: {
          type: 0,
          permission_name: "owner",
          threshold: 1,
          keys: [{ address: "Tsender", weight: 1 }],
        },
        activePermissions: {
          type: 2,
          permission_name: "active",
          threshold: 1,
          operations: "7fff1fc0033e0000000000000000000000000000000000000000000000000000",
          keys: [{ address: "Tsender", weight: 1 }],
        },
      });
      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("txhash789");
    });

    it("get_account should handle errors gracefully", async () => {
      (services.getAccount as any).mockRejectedValue(new Error("Network error"));
      const result = await registeredTools.get("get_account").handler({
        address: "Taddr",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Network error");
    });
  });

  describe("Governance Tools (Read)", () => {
    it("list_witnesses should call listWitnesses service", async () => {
      const mockWitnesses = [{ address: "SR1" }, { address: "SR2" }];
      (services.listWitnesses as any).mockResolvedValue(mockWitnesses);

      const result = await registeredTools.get("list_witnesses").handler({ network: "nile" });

      expect(services.listWitnesses).toHaveBeenCalledWith("nile");
      expect(result.isError).toBeUndefined();
    });

    it("list_witnesses should return error on failure", async () => {
      (services.listWitnesses as any).mockRejectedValue(new Error("network error"));

      const result = await registeredTools.get("list_witnesses").handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error listing witnesses");
    });

    it("get_paginated_witnesses should call getPaginatedWitnessList service", async () => {
      const mockResult = { witnesses: [{ address: "SR1" }] };
      (services.getPaginatedWitnessList as any).mockResolvedValue(mockResult);

      const result = await registeredTools.get("get_paginated_witnesses").handler({
        offset: 10,
        limit: 5,
        network: "nile",
      });

      expect(services.getPaginatedWitnessList).toHaveBeenCalledWith(10, 5, "nile");
      expect(result.isError).toBeUndefined();
    });

    it("get_paginated_witnesses should use defaults for offset and limit", async () => {
      (services.getPaginatedWitnessList as any).mockResolvedValue({ witnesses: [] });

      await registeredTools.get("get_paginated_witnesses").handler({});

      expect(services.getPaginatedWitnessList).toHaveBeenCalledWith(0, 20, "mainnet");
    });

    it("get_next_maintenance_time should call getNextMaintenanceTime service", async () => {
      const mockTime = {
        secondsUntilNextMaintenance: 3600,
        nextMaintenanceTimestamp: Date.now() + 3600000,
        nextMaintenanceDate: "2026-01-01T00:00:00.000Z",
      };
      (services.getNextMaintenanceTime as any).mockResolvedValue(mockTime);

      const result = await registeredTools.get("get_next_maintenance_time").handler({
        network: "nile",
      });

      expect(services.getNextMaintenanceTime).toHaveBeenCalledWith("nile");
      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.network).toBe("nile");
    });

    it("get_reward should call getReward service", async () => {
      (services.getReward as any).mockResolvedValue(1000000);

      const result = await registeredTools.get("get_reward").handler({
        address: "TAddr1",
        network: "nile",
      });

      expect(services.getReward).toHaveBeenCalledWith("TAddr1", "nile");
      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.address).toBe("TAddr1");
      expect(content.reward).toBe(1000000);
    });

    it("get_brokerage should call getBrokerage service", async () => {
      (services.getBrokerage as any).mockResolvedValue(20);

      const result = await registeredTools.get("get_brokerage").handler({
        witnessAddress: "TSR1",
        network: "nile",
      });

      expect(services.getBrokerage).toHaveBeenCalledWith("TSR1", "nile");
      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.brokerage).toBe(20);
      expect(content.description).toContain("20%");
    });
  });

  describe("Governance Tools (Write)", () => {
    it("create_witness should call createWitness service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("TMyAddr");
      (services.createWitness as any).mockResolvedValue("txWitness1");

      const result = await registeredTools.get("create_witness").handler({
        url: "https://example.com",
        network: "nile",
      });

      expect(services.createWitness).toHaveBeenCalledWith("key", "https://example.com", "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("txWitness1");
      expect(content.url).toBe("https://example.com");
    });

    it("create_witness should return error on failure", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("TMyAddr");
      (services.createWitness as any).mockRejectedValue(new Error("insufficient balance"));

      const result = await registeredTools.get("create_witness").handler({
        url: "https://example.com",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error creating witness");
    });

    it("update_witness should call updateWitness service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("TMyAddr");
      (services.updateWitness as any).mockResolvedValue("txUpdate1");

      const result = await registeredTools.get("update_witness").handler({
        url: "https://new-url.com",
        network: "nile",
      });

      expect(services.updateWitness).toHaveBeenCalledWith("key", "https://new-url.com", "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("txUpdate1");
    });

    it("vote_witness should call voteWitness service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("TMyAddr");
      (services.voteWitness as any).mockResolvedValue("txVote1");

      const votes = [
        { address: "TSR1", voteCount: 100 },
        { address: "TSR2", voteCount: 200 },
      ];
      const result = await registeredTools.get("vote_witness").handler({
        votes,
        network: "nile",
      });

      expect(services.voteWitness).toHaveBeenCalledWith("key", votes, "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("txVote1");
      expect(content.votes).toEqual(votes);
    });

    it("withdraw_balance should call withdrawBalance service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("TMyAddr");
      (services.withdrawBalance as any).mockResolvedValue("txWithdraw1");

      const result = await registeredTools.get("withdraw_balance").handler({ network: "nile" });

      expect(services.withdrawBalance).toHaveBeenCalledWith("key", "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("txWithdraw1");
    });

    it("update_brokerage should call updateBrokerage service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("TMyAddr");
      (services.updateBrokerage as any).mockResolvedValue("txBrok1");

      const result = await registeredTools.get("update_brokerage").handler({
        brokerage: 30,
        network: "nile",
      });

      expect(services.updateBrokerage).toHaveBeenCalledWith("key", 30, "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("txBrok1");
      expect(content.brokerage).toBe(30);
      expect(content.voterShare).toBe(70);
    });
  });

  describe("Proposal Tools (Read)", () => {
    it("list_proposals should call listProposals service", async () => {
      const mockProposals = [{ proposal_id: 1 }, { proposal_id: 2 }];
      (services.listProposals as any).mockResolvedValue(mockProposals);

      const result = await registeredTools.get("list_proposals").handler({ network: "nile" });

      expect(services.listProposals).toHaveBeenCalledWith("nile");
      expect(result.isError).toBeUndefined();
    });

    it("list_proposals should return error on failure", async () => {
      (services.listProposals as any).mockRejectedValue(new Error("network error"));

      const result = await registeredTools.get("list_proposals").handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error listing proposals");
    });

    it("get_proposal should call getProposalById service", async () => {
      const mockProposal = { proposal_id: 5, state: "APPROVED" };
      (services.getProposalById as any).mockResolvedValue(mockProposal);

      const result = await registeredTools.get("get_proposal").handler({
        proposalId: 5,
        network: "nile",
      });

      expect(services.getProposalById).toHaveBeenCalledWith(5, "nile");
      expect(result.isError).toBeUndefined();
    });
  });

  describe("Proposal Tools (Write)", () => {
    it("create_proposal should call createProposal service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("TMyAddr");
      (services.createProposal as any).mockResolvedValue("txProp1");

      const result = await registeredTools.get("create_proposal").handler({
        parameters: { "6": 100 },
        network: "nile",
      });

      expect(services.createProposal).toHaveBeenCalledWith("key", { 6: 100 }, "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("txProp1");
    });

    it("create_proposal should return error on failure", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("TMyAddr");
      (services.createProposal as any).mockRejectedValue(new Error("not an SR"));

      const result = await registeredTools.get("create_proposal").handler({
        parameters: { "6": 100 },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error creating proposal");
    });

    it("approve_proposal should call approveProposal service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("TMyAddr");
      (services.approveProposal as any).mockResolvedValue("txApprove1");

      const result = await registeredTools.get("approve_proposal").handler({
        proposalId: 5,
        approve: true,
        network: "nile",
      });

      expect(services.approveProposal).toHaveBeenCalledWith("key", 5, true, "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("txApprove1");
      expect(content.approve).toBe(true);
    });

    it("approve_proposal should handle disapproval", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("TMyAddr");
      (services.approveProposal as any).mockResolvedValue("txDisapprove1");

      const result = await registeredTools.get("approve_proposal").handler({
        proposalId: 3,
        approve: false,
      });

      expect(services.approveProposal).toHaveBeenCalledWith("key", 3, false, "mainnet");
      const content = JSON.parse(result.content[0].text);
      expect(content.approve).toBe(false);
      expect(content.message).toContain("disapproved");
    });

    it("delete_proposal should call deleteProposal service", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("TMyAddr");
      (services.deleteProposal as any).mockResolvedValue("txDel1");

      const result = await registeredTools.get("delete_proposal").handler({
        proposalId: 7,
        network: "nile",
      });

      expect(services.deleteProposal).toHaveBeenCalledWith("key", 7, "nile");
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBe("txDel1");
      expect(content.proposalId).toBe(7);
    });

    it("delete_proposal should return error on failure", async () => {
      (services.getConfiguredPrivateKey as any).mockReturnValue("key");
      (services.getWalletAddressFromKey as any).mockReturnValue("TMyAddr");
      (services.deleteProposal as any).mockRejectedValue(new Error("not the proposer"));

      const result = await registeredTools.get("delete_proposal").handler({
        proposalId: 7,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error deleting proposal");
    });
  });
});
