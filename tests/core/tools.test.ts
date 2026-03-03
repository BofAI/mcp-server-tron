import { describe, it, expect, beforeEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTRONTools } from "../../src/core/tools";
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
    updateSetting: vi.fn(),
    updateEnergyLimit: vi.fn(),
    clearABI: vi.fn(),
    estimateEnergy: vi.fn(),
    freezeBalanceV2: vi.fn(),
    unfreezeBalanceV2: vi.fn(),
    withdrawExpireUnfreeze: vi.fn(),
    cancelAllUnfreezeV2: vi.fn(),
    getAvailableUnfreezeCount: vi.fn(),
    getCanWithdrawUnfreezeAmount: vi.fn(),
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
    it("should register all 30 TRON tools", () => {
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
        "update_contract_setting",
        "update_energy_limit",
        "clear_abi",
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
        "cancel_all_unfreeze_v2",
        "get_available_unfreeze_count",
        "get_can_withdraw_unfreeze_amount",
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

      // get_wallet_address IS a read tool (readOnlyHint: true)
      // Since isWalletConfigured is mocked to true, it SHOULD be registered
      // even in readonly mode because it doesn't perform write operations.
      expect(registeredTools.has("get_wallet_address")).toBe(true);

      // Read tools should STILL be registered
      expect(registeredTools.has("get_balance")).toBe(true);
      expect(registeredTools.has("get_chain_info")).toBe(true);
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
      expect(registeredTools.has("cancel_all_unfreeze_v2")).toBe(false);

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
  });
});
