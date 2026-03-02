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
    estimateEnergy: vi.fn(),
    freezeBalanceV2: vi.fn(),
    unfreezeBalanceV2: vi.fn(),
    withdrawExpireUnfreeze: vi.fn(),
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
    it("should register all 37 TRON tools", () => {
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
        "multicall",
        "write_contract",
        "transfer_trx",
        "transfer_trc20",
        "sign_message",
        "deploy_contract",
        "estimate_energy",
        "freeze_balance_v2",
        "unfreeze_balance_v2",
        "withdraw_expire_unfreeze",
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
      ];
      expectedTools.forEach((tool) => {
        expect(registeredTools.has(tool)).toBe(true);
      });
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

      // Governance/proposal read tools should STILL be registered (no wallet needed)
      expect(registeredTools.has("list_witnesses")).toBe(true);
      expect(registeredTools.has("get_paginated_witnesses")).toBe(true);
      expect(registeredTools.has("get_next_maintenance_time")).toBe(true);
      expect(registeredTools.has("get_reward")).toBe(true);
      expect(registeredTools.has("get_brokerage")).toBe(true);
      expect(registeredTools.has("list_proposals")).toBe(true);
      expect(registeredTools.has("get_proposal")).toBe(true);
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
