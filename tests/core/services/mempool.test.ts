import { describe, it, expect } from "vitest";
import {
  getTransactionListFromPending,
  getTransactionFromPending,
  getPendingSize,
} from "../../../src/core/services/index";

describe("Mempool Services Integration (Nile)", () => {
  it("should get pending transaction list", async () => {
    const txIds = await getTransactionListFromPending("nile");
    expect(Array.isArray(txIds)).toBe(true);
    expect(txIds.length).toBeGreaterThanOrEqual(0);
  }, 20000);

  it("should get pending size", async () => {
    const size = await getPendingSize("nile");
    expect(typeof size).toBe("number");
    expect(size).toBeGreaterThanOrEqual(0);
  }, 20000);

  it("should handle non-existent transaction in pending pool", async () => {
    const fakeTxId = "0000000000000000000000000000000000000000000000000000000000000000";
    const result = await getTransactionFromPending(fakeTxId, "nile");
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  }, 20000);
});
