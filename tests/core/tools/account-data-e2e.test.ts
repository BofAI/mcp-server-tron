import { describe, it, expect, beforeAll } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTRONTools } from "../../../src/core/tools/index";

/**
 * E2E tests for TronGrid data tools.
 * Uses a real McpServer instance hitting the Nile testnet.
 */

const TEST_ADDRESS = "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf"; // Nile USDT contract

describe("TronGrid Data Tools E2E (Nile)", () => {
  let registeredTools: Map<string, any>;

  beforeAll(() => {
    const server = new McpServer({ name: "e2e-test", version: "1.0.0" });
    registeredTools = new Map();
    const originalRegisterTool = server.registerTool.bind(server);
    server.registerTool = (name: string, schema: any, handler: any) => {
      registeredTools.set(name, { schema, handler });
      return originalRegisterTool(name, schema, handler);
    };
    registerTRONTools(server);
  });

  it("get_account_info should return account data from Nile", async () => {
    const result = await registeredTools.get("get_account_info").handler({
      address: TEST_ADDRESS,
      network: "nile",
    });
    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.address).toMatch(/^T/);
    expect(typeof content.balance_trx).toBe("string");
  }, 20000);

  it("get_account_transactions should return transactions from Nile", async () => {
    const result = await registeredTools.get("get_account_transactions").handler({
      address: TEST_ADDRESS,
      limit: 3,
      network: "nile",
    });
    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(Array.isArray(content.transactions)).toBe(true);
    expect(content.transactions.length).toBeLessThanOrEqual(3);
    expect(typeof content.count).toBe("number");
  }, 20000);

  it("get_account_trc20_transactions should return TRC20 transactions from Nile", async () => {
    const result = await registeredTools.get("get_account_trc20_transactions").handler({
      address: TEST_ADDRESS,
      limit: 3,
      network: "nile",
    });
    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(Array.isArray(content.transactions)).toBe(true);
  }, 20000);

  it("get_contract_transactions should return contract transactions from Nile", async () => {
    const result = await registeredTools.get("get_contract_transactions").handler({
      address: TEST_ADDRESS,
      limit: 3,
      network: "nile",
    });
    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(Array.isArray(content.transactions)).toBe(true);
    expect(typeof content.count).toBe("number");
  }, 20000);

  it("get_account_trc20_balances should return balances from Nile", async () => {
    const result = await registeredTools.get("get_account_trc20_balances").handler({
      address: TEST_ADDRESS,
      network: "nile",
    });
    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(Array.isArray(content.balances)).toBe(true);
    expect(typeof content.count).toBe("number");
  }, 20000);

  it("get_trc20_token_holders should return holders from Nile", async () => {
    const result = await registeredTools.get("get_trc20_token_holders").handler({
      address: TEST_ADDRESS,
      limit: 3,
      network: "nile",
    });
    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(Array.isArray(content.holders)).toBe(true);
    expect(typeof content.count).toBe("number");
  }, 20000);
});
