import { describe, it, expect } from "vitest";
import {
  getEventsByTransactionId,
  getEventsByContractAddress,
  getEventsByBlockNumber,
  getEventsOfLatestBlock,
} from "../../../src/core/services/index";

const USDT_ADDRESS_NILE = "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf";

describe("Event Services Integration (Nile)", () => {
  it("should get events of latest block", async () => {
    const result = await getEventsOfLatestBlock({}, "nile");
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  }, 20000);

  it("should get events by contract address", async () => {
    const result = await getEventsByContractAddress(USDT_ADDRESS_NILE, { limit: 5 }, "nile");
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeLessThanOrEqual(5);
  }, 20000);

  it("should get events by block number", async () => {
    // Use a recent block that likely has events
    const latestResult = await getEventsOfLatestBlock({}, "nile");
    const blockNumber =
      latestResult.data.length > 0 ? (latestResult.data[0] as any).block_number : 65000000;

    const result = await getEventsByBlockNumber(blockNumber, {}, "nile");
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  }, 20000);

  it("should get events by transaction id with empty result for fake tx", async () => {
    const fakeTxId = "0000000000000000000000000000000000000000000000000000000000000000";
    const result = await getEventsByTransactionId(fakeTxId, {}, "nile");
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBe(0);
  }, 20000);
});
