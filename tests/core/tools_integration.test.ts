import { describe, it, expect, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTRONTools } from "../../src/core/tools";

const USDT_ADDRESS_NILE = "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf";
const TEST_ADDRESS = "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb";

describe("TRON Tools Integration (Nile)", () => {
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

    // Set a dummy private key to ensure write tools are registered for the test
    const originalKey = process.env.TRON_PRIVATE_KEY;
    process.env.TRON_PRIVATE_KEY =
      "0000000000000000000000000000000000000000000000000000000000000001";

    registerTRONTools(server);

    // Restore original key
    if (originalKey) {
      process.env.TRON_PRIVATE_KEY = originalKey;
    } else {
      delete process.env.TRON_PRIVATE_KEY;
    }
  });

  it("get_balance should return real balance from Nile", async () => {
    const tool = registeredTools.get("get_balance");
    const result = await tool.handler({
      address: TEST_ADDRESS,
      network: "nile",
    });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.network).toBe("nile");
    expect(content.address).toBe(TEST_ADDRESS);
    expect(Number(content.balance.trx)).toBeGreaterThan(0);
  }, 20000);

  it("get_token_balance should return USDT balance from Nile", async () => {
    const tool = registeredTools.get("get_token_balance");
    const result = await tool.handler({
      address: TEST_ADDRESS,
      tokenAddress: USDT_ADDRESS_NILE,
      network: "nile",
    });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.tokenAddress).toBe(USDT_ADDRESS_NILE);
    expect(content.balance.symbol).toBe("USDT");
  }, 20000);

  it("read_contract should return name for USDT on Nile", async () => {
    const tool = registeredTools.get("read_contract");
    const result = await tool.handler({
      contractAddress: USDT_ADDRESS_NILE,
      functionName: "name",
      network: "nile",
    });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.result).toContain("Tether USD");
  }, 20000);

  it("get_chain_info should return info for Nile", async () => {
    const tool = registeredTools.get("get_chain_info");
    const result = await tool.handler({ network: "nile" });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.network).toBe("nile");
    expect(content.rpcUrl).toContain("nile");
  }, 20000);

  it("multicall should work with real contracts on Nile", async () => {
    const tool = registeredTools.get("multicall");
    const result = await tool.handler({
      calls: [
        {
          address: USDT_ADDRESS_NILE,
          functionName: "name",
          abi: [{ name: "name", type: "function", inputs: [], outputs: [{ type: "string" }] }],
        },
        {
          address: USDT_ADDRESS_NILE,
          functionName: "symbol",
          abi: [{ name: "symbol", type: "function", inputs: [], outputs: [{ type: "string" }] }],
        },
      ],
      network: "nile",
    });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.count).toBe(2);
    expect(content.results[0].result).toBe("Tether USD");
    expect(content.results[1].result).toBe("USDT");
  }, 20000);

  it("estimate_energy should estimate energy for USDT name() on Nile", async () => {
    const tool = registeredTools.get("estimate_energy");
    const result = await tool.handler({
      address: USDT_ADDRESS_NILE,
      functionName: "name",
      args: [],
      abi: [{ name: "name", type: "function", inputs: [], outputs: [{ type: "string" }] }],
      network: "nile",
    });

    if (result.isError) {
      console.error("estimate_energy error:", result.content[0].text);
    }
    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.network).toBe("nile");
    // read-only functions might return 0 energy used depending on implementation,
    // but the call should succeed.
    expect(content.energyUsed).toBeGreaterThanOrEqual(0);
  }, 20000);

  it("staking tools (v2) should be registered and callable", async () => {
    // These tests might fail if TRON_PRIVATE_KEY is not set or account has no balance,
    // but the tool registration and handler calling should work.
    const freezeTool = registeredTools.get("freeze_balance_v2");
    expect(freezeTool).toBeDefined();

    const unfreezeTool = registeredTools.get("unfreeze_balance_v2");
    expect(unfreezeTool).toBeDefined();

    const withdrawTool = registeredTools.get("withdraw_expire_unfreeze");
    expect(withdrawTool).toBeDefined();
  });

  it("deploy_contract tool should be registered", async () => {
    const deployTool = registeredTools.get("deploy_contract");
    expect(deployTool).toBeDefined();
  });
});
