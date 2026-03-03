import { describe, it, expect } from "vitest";
import {
  formatAccountInfo,
  formatTransactions,
  formatTrc20Transactions,
  formatInternalTransactions,
  normalizeKeyValuePairs,
} from "../../../src/core/services/account-data";

describe("normalizeKeyValuePairs", () => {
  it("should convert {addr: bal} objects to {address, balance}", () => {
    const data = [
      { "41a614f803b6fd780986a42c78ec9c7f77e6ded13c": "1000000" },
      { "41b2f6e8e5c1b8e5f9d3c4a7e6d5c3b2a1f0e9d8c7": "5000000" },
    ];
    const result = normalizeKeyValuePairs(data);
    expect(result).toHaveLength(2);
    // hex→base58 conversion
    expect(result[0].address).toMatch(/^T/);
    expect(result[0].balance).toBe("1000000");
    expect(result[1].address).toMatch(/^T/);
    expect(result[1].balance).toBe("5000000");
  });

  it("should handle empty array", () => {
    expect(normalizeKeyValuePairs([])).toEqual([]);
  });

  it("should handle non-array input", () => {
    expect(normalizeKeyValuePairs(null)).toEqual([]);
    expect(normalizeKeyValuePairs(undefined)).toEqual([]);
    expect(normalizeKeyValuePairs("string" as any)).toEqual([]);
  });
});

describe("formatAccountInfo", () => {
  it("should format raw account data", () => {
    const raw = {
      data: [
        {
          address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
          balance: 10000000,
          account_name: "48656c6c6f",
          create_time: 1700000000000,
          net_usage: 100,
          free_net_usage: 50,
          account_resource: { energy_usage: 200 },
          trc20: [{ "41a614f803b6fd780986a42c78ec9c7f77e6ded13c": "999" }],
          frozenV2: [{ type: "ENERGY", amount: 500 }],
          votes: [{ vote_address: "TAddr", vote_count: 10 }],
        },
      ],
    };

    const result = formatAccountInfo(raw);
    expect(result.address).toMatch(/^T/);
    expect(result.balance_trx).toBe("10"); // 10_000_000 sun = 10 TRX
    expect(result.account_name).toBe("Hello"); // hex→utf8
    expect(result.create_time).toBe(1700000000000);
    expect(result.net_usage).toBe(100);
    expect(result.free_net_usage).toBe(50);
    expect(result.energy_usage).toBe(200);
    expect(result.trc20_balances).toHaveLength(1);
    expect(result.trc20_balances[0].balance).toBe("999");
    expect(result.frozen_v2).toHaveLength(1);
    expect(result.votes).toHaveLength(1);
  });

  it("should handle empty/missing fields", () => {
    const result = formatAccountInfo({ data: [{}] });
    expect(result.balance_trx).toBe("0");
    expect(result.account_name).toBe("");
    expect(result.trc20_balances).toEqual([]);
    expect(result.frozen_v2).toEqual([]);
    expect(result.votes).toEqual([]);
  });
});

describe("formatTransactions", () => {
  it("should flatten raw transaction data", () => {
    const raw = {
      data: [
        {
          txID: "abc123",
          blockNumber: 50000,
          block_timestamp: 1700000000000,
          raw_data: {
            contract: [
              {
                type: "TransferContract",
                parameter: {
                  value: {
                    owner_address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
                    to_address: "41b2f6e8e5c1b8e5f9d3c4a7e6d5c3b2a1f0e9d8c7",
                    amount: 5000000,
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS" }],
          cost: { fee: 100000, energy_usage: 50, net_usage: 300 },
          _unconfirmed: false,
        },
      ],
      meta: { fingerprint: "page2" },
    };

    const result = formatTransactions(raw);
    expect(result.transactions).toHaveLength(1);
    expect(result.count).toBe(1);
    expect(result.fingerprint).toBe("page2");

    const tx = result.transactions[0];
    expect(tx.txID).toBe("abc123");
    expect(tx.type).toBe("TransferContract");
    expect(tx.from).toMatch(/^T/);
    expect(tx.to).toMatch(/^T/);
    expect(tx.amount_trx).toBe("5"); // 5_000_000 sun = 5 TRX
    expect(tx.confirmed).toBe(true);
    expect(tx.fee_trx).toBe("0.1"); // 100_000 sun = 0.1 TRX
    expect(tx.energyUsage).toBe(50);
    expect(tx.netUsage).toBe(300);
  });

  it("should handle empty data", () => {
    const result = formatTransactions({ data: [] });
    expect(result.transactions).toEqual([]);
    expect(result.count).toBe(0);
    expect(result.fingerprint).toBeUndefined();
  });

  it("should use contract_address as 'to' when to_address is missing", () => {
    const raw = {
      data: [
        {
          txID: "xyz",
          raw_data: {
            contract: [
              {
                type: "TriggerSmartContract",
                parameter: {
                  value: {
                    owner_address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
                    contract_address: "41b2f6e8e5c1b8e5f9d3c4a7e6d5c3b2a1f0e9d8c7",
                  },
                },
              },
            ],
          },
        },
      ],
    };
    const tx = formatTransactions(raw).transactions[0];
    expect(tx.to).toMatch(/^T/);
  });
});

describe("formatTrc20Transactions", () => {
  it("should format TRC20 transfer with token info", () => {
    const raw = {
      data: [
        {
          transaction_id: "trc20tx1",
          block_timestamp: 1700000000000,
          from: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
          to: "41b2f6e8e5c1b8e5f9d3c4a7e6d5c3b2a1f0e9d8c7",
          value: "1000000",
          token_info: {
            address: "41ddd5c8e5c1b8e5f9d3c4a7e6d5c3b2a1f0e9d8c7",
            name: "Tether USD",
            symbol: "USDT",
            decimals: 6,
          },
          type: "Transfer",
          _unconfirmed: true,
        },
      ],
      meta: { fingerprint: "fp123" },
    };

    const result = formatTrc20Transactions(raw);
    expect(result.transactions).toHaveLength(1);
    expect(result.fingerprint).toBe("fp123");

    const tx = result.transactions[0];
    expect(tx.from).toMatch(/^T/);
    expect(tx.to).toMatch(/^T/);
    expect(tx.value).toBe("1"); // 1_000_000 / 10^6 = 1
    expect(tx.value_raw).toBe("1000000");
    expect(tx.token_symbol).toBe("USDT");
    expect(tx.token_decimals).toBe(6);
    expect(tx.confirmed).toBe(false);
  });

  it("should handle missing token_info", () => {
    const raw = { data: [{ transaction_id: "tx", value: "100" }] };
    const tx = formatTrc20Transactions(raw).transactions[0];
    expect(tx.value).toBe("100"); // decimals=0, so no division
    expect(tx.token_name).toBe("");
    expect(tx.token_symbol).toBe("");
  });
});

describe("formatInternalTransactions", () => {
  it("should flatten internal transaction data", () => {
    const raw = {
      data: [
        {
          transaction_id: "parent_tx",
          internal_transaction_id: "int_tx_1",
          block: 99999,
          block_timestamp: 1700000000000,
          caller_address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
          transferTo_address: "41b2f6e8e5c1b8e5f9d3c4a7e6d5c3b2a1f0e9d8c7",
          callValueInfo: [{ callValue: 1000000 }],
          data: { note: "63616c6c", rejected: false },
          _unconfirmed: false,
        },
      ],
      meta: { fingerprint: "ifp" },
    };

    const result = formatInternalTransactions(raw);
    expect(result.transactions).toHaveLength(1);
    expect(result.fingerprint).toBe("ifp");

    const tx = result.transactions[0];
    expect(tx.from).toMatch(/^T/);
    expect(tx.to).toMatch(/^T/);
    expect(tx.note).toBe("call"); // hex→utf8
    expect(tx.rejected).toBe(false);
    expect(tx.confirmed).toBe(true);
  });

  it("should handle missing data fields", () => {
    const result = formatInternalTransactions({ data: [{}] });
    const tx = result.transactions[0];
    expect(tx.note).toBe("");
    expect(tx.rejected).toBe(false);
    expect(tx.from).toBe("");
    expect(tx.to).toBe("");
  });
});
