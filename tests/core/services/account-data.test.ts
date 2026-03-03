import { describe, it, expect } from "vitest";
import {
  getAccountInfo,
  getAccountTransactions,
  getAccountTrc20Transactions,
  getAccountInternalTransactions,
  getAccountTrc20Balances,
} from "../../../src/core/services/index";

// Well-known Nile testnet address (the USDT contract deployer has activity)
const TEST_ADDRESS = "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf";

describe("Account Data Services Integration (Nile)", () => {
  it("should get account info", async () => {
    const result = await getAccountInfo(TEST_ADDRESS, {}, "nile");
    expect(result.address).toMatch(/^T/);
    expect(typeof result.balance_trx).toBe("string");
    expect(Array.isArray(result.trc20_balances)).toBe(true);
  }, 20000);

  it("should get account transactions", async () => {
    const result = await getAccountTransactions(TEST_ADDRESS, { limit: 5 }, "nile");
    expect(Array.isArray(result.transactions)).toBe(true);
    expect(result.transactions.length).toBeLessThanOrEqual(5);
    expect(typeof result.count).toBe("number");
  }, 20000);

  it("should get account TRC20 transactions", async () => {
    const result = await getAccountTrc20Transactions(TEST_ADDRESS, { limit: 5 }, "nile");
    expect(Array.isArray(result.transactions)).toBe(true);
    expect(result.transactions.length).toBeLessThanOrEqual(5);
  }, 20000);

  it("should get account internal transactions", async () => {
    const result = await getAccountInternalTransactions(TEST_ADDRESS, { limit: 5 }, "nile");
    expect(Array.isArray(result.transactions)).toBe(true);
    expect(typeof result.count).toBe("number");
  }, 20000);

  it("should get account TRC20 balances", async () => {
    const result = await getAccountTrc20Balances(TEST_ADDRESS, {}, "nile");
    expect(Array.isArray(result.balances)).toBe(true);
    expect(typeof result.count).toBe("number");
  }, 20000);
});
