import { describe, it, expect } from "vitest";
import { formatEventData } from "../../../src/core/services/events";

describe("formatEventData", () => {
  it("should format a standard Transfer event", () => {
    const raw = {
      data: [
        {
          event_name: "Transfer",
          event: "Transfer(address,address,uint256)",
          transaction_id: "abc123",
          block_number: 100,
          block_timestamp: 1700000000000,
          contract_address: "TContractAddr",
          caller_contract_address: "TCallerAddr",
          _unconfirmed: false,
          result: {
            0: "0x1234567890abcdef1234567890abcdef12345678",
            1: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
            2: "1000000",
            from: "0x1234567890abcdef1234567890abcdef12345678",
            to: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
            value: "1000000",
          },
          result_type: { from: "address", to: "address", value: "uint256" },
        },
      ],
      meta: { fingerprint: "next-page-token" },
    };

    const result = formatEventData(raw);

    expect(result.totalEvents).toBe(1);
    expect(result.fingerprint).toBe("next-page-token");

    const event = result.events[0];
    expect(event.eventName).toBe("Transfer");
    expect(event.signature).toBe("Transfer(address,address,uint256)");
    expect(event.transactionId).toBe("abc123");
    expect(event.blockNumber).toBe(100);
    expect(event.confirmed).toBe(true);
    expect(event.contractAddress).toBe("TContractAddr");

    // Positional keys (0, 1, 2) should be stripped
    expect(Object.keys(event.params)).not.toContain("0");
    expect(Object.keys(event.params)).not.toContain("1");
    expect(Object.keys(event.params)).not.toContain("2");

    // Named keys should include type annotation
    expect(event.params["from (address)"]).toBeDefined();
    expect(event.params["to (address)"]).toBeDefined();
    expect(event.params["value (uint256)"]).toBe("1000000");
  });

  it("should convert hex addresses to base58 in params", () => {
    const raw = {
      data: [
        {
          event_name: "Transfer",
          result: { owner: "0x0000000000000000000000000000000000000000" },
          result_type: { owner: "address" },
        },
      ],
    };

    const result = formatEventData(raw);
    const ownerValue = result.events[0].params["owner (address)"];
    // Should be base58 (starts with T), not hex
    expect(ownerValue).toMatch(/^T/);
  });

  it("should handle non-hex address values without conversion", () => {
    const raw = {
      data: [
        {
          event_name: "Log",
          result: { msg: "hello" },
          result_type: { msg: "string" },
        },
      ],
    };

    const result = formatEventData(raw);
    expect(result.events[0].params["msg (string)"]).toBe("hello");
  });

  it("should handle missing result_type gracefully", () => {
    const raw = {
      data: [
        {
          event_name: "CustomEvent",
          result: { foo: "bar" },
        },
      ],
    };

    const result = formatEventData(raw);
    // Without type info, key should be plain name
    expect(result.events[0].params["foo"]).toBe("bar");
  });

  it("should handle empty data array", () => {
    const result = formatEventData({ data: [] });
    expect(result.events).toEqual([]);
    expect(result.totalEvents).toBe(0);
    expect(result.fingerprint).toBeUndefined();
  });

  it("should handle missing data field", () => {
    const result = formatEventData({});
    expect(result.events).toEqual([]);
    expect(result.totalEvents).toBe(0);
  });

  it("should omit fingerprint when not present in meta", () => {
    const result = formatEventData({ data: [], meta: {} });
    expect(result.fingerprint).toBeUndefined();
  });

  it("should invert _unconfirmed to confirmed", () => {
    const raw = {
      data: [
        { event_name: "A", _unconfirmed: true, result: {} },
        { event_name: "B", _unconfirmed: false, result: {} },
        { event_name: "C", result: {} }, // undefined → confirmed=true
      ],
    };

    const result = formatEventData(raw);
    expect(result.events[0].confirmed).toBe(false);
    expect(result.events[1].confirmed).toBe(true);
    expect(result.events[2].confirmed).toBe(true);
  });

  it("should leave non-address hex-like strings unconverted", () => {
    const raw = {
      data: [
        {
          event_name: "Log",
          result: { data: "0xdeadbeef" }, // short hex, not 42 chars
          result_type: { data: "bytes" },
        },
      ],
    };

    const result = formatEventData(raw);
    expect(result.events[0].params["data (bytes)"]).toBe("0xdeadbeef");
  });
});
