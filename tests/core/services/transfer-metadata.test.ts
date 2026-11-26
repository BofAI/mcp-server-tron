import { it, expect, vi } from "vitest";
import { getTronWeb } from "../../../src/core/services/clients.js";
import { transferTRC20 } from "../../../src/core/services/transfer.js";

vi.mock("../../../src/core/services/clients.js", () => ({ getTronWeb: vi.fn() }));
vi.mock("../../../src/core/services/agent-wallet.js", () => ({
  getOwnerAddress: vi.fn().mockResolvedValue("sender"),
  signTransaction: vi.fn().mockResolvedValue({}),
}));

function mockTransferMetadata(decimals: () => Promise<bigint>) {
  const sendRawTransaction = vi.fn().mockResolvedValue({ result: true, txid: "sent" });
  const symbol = vi.fn().mockResolvedValue("TRC20");
  vi.mocked(getTronWeb).mockReturnValue({
    transactionBuilder: {
      triggerSmartContract: vi
        .fn()
        .mockResolvedValue({ transaction: {}, result: { result: true } }),
    },
    trx: { sendRawTransaction },
    contract: () => ({
      at: vi.fn().mockResolvedValue({
        methods: {
          decimals: () => ({ call: decimals }),
          symbol: () => ({ call: symbol }),
        },
      }),
    }),
  } as unknown as ReturnType<typeof getTronWeb>);
  return { sendRawTransaction, symbol };
}

it("returns formatted metadata when the lookups complete before the deadline", async () => {
  mockTransferMetadata(async () => 6n);
  await expect(transferTRC20("token", "receiver", "1000000")).resolves.toEqual({
    txHash: "sent",
    amount: { raw: "1000000", formatted: "1" },
    token: { symbol: "TRC20", decimals: 6 },
  });
});

it("returns the broadcast transaction when token decimals are out of range", async () => {
  const { sendRawTransaction } = mockTransferMetadata(async () => 256n);

  await expect(transferTRC20("token", "receiver", "1000000")).resolves.toEqual({
    txHash: "sent",
    amount: { raw: "1000000", formatted: null },
    token: null,
  });
  expect(sendRawTransaction).toHaveBeenCalledTimes(1);
});

it("returns on timeout without starting another lookup when the stalled RPC settles", async () => {
  vi.useFakeTimers();
  try {
    const decimals = Promise.withResolvers<bigint>();
    const { sendRawTransaction, symbol } = mockTransferMetadata(() => decimals.promise);

    const transfer = transferTRC20("token", "receiver", "1000000");
    await vi.advanceTimersByTimeAsync(2_000);

    await expect(transfer).resolves.toEqual({
      txHash: "sent",
      amount: { raw: "1000000", formatted: null },
      token: null,
    });
    decimals.resolve(6n);
    await vi.advanceTimersByTimeAsync(0);
    expect(symbol).not.toHaveBeenCalled();
    expect(sendRawTransaction).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});
