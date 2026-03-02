import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTronWeb } from "../../../src/core/services/clients.js";
import {
  broadcastHex,
  broadcastTransaction,
  createTransaction,
} from "../../../src/core/services/broadcast";

vi.mock("../../../src/core/services/clients.js", () => {
  return {
    getTronWeb: vi.fn(),
  };
});

describe("services/broadcast", () => {
  const trxSendRawTransaction = vi.fn();
  const trxSendHexTransaction = vi.fn();
  const transactionBuilderSendTrx = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (getTronWeb as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      trx: {
        sendRawTransaction: trxSendRawTransaction,
        sendHexTransaction: trxSendHexTransaction,
      },
      transactionBuilder: {
        sendTrx: transactionBuilderSendTrx,
      },
    });
  });

  it("broadcastTransaction should call tronWeb.trx.sendRawTransaction", async () => {
    trxSendRawTransaction.mockResolvedValueOnce({ result: true, txid: "abc" });

    const tx = { signature: ["00"], raw_data: {} };
    const result = await broadcastTransaction(tx, "nile");

    expect(getTronWeb).toHaveBeenCalledWith("nile");
    expect(trxSendRawTransaction).toHaveBeenCalledWith(tx);
    expect(result).toEqual({ result: true, txid: "abc" });
  });

  it("broadcastHex should call tronWeb.trx.sendHexTransaction", async () => {
    trxSendHexTransaction.mockResolvedValueOnce({ result: true, txid: "def" });

    const result = await broadcastHex("0a01", "mainnet");

    expect(getTronWeb).toHaveBeenCalledWith("mainnet");
    expect(trxSendHexTransaction).toHaveBeenCalledWith("0a01");
    expect(result).toEqual({ result: true, txid: "def" });
  });

  it("createTransaction should call tronWeb.transactionBuilder.sendTrx", async () => {
    transactionBuilderSendTrx.mockResolvedValueOnce({ raw_data: { contract: [] } });

    const result = await createTransaction(
      "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
      "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
      1000,
      "shasta",
    );

    expect(getTronWeb).toHaveBeenCalledWith("shasta");
    expect(transactionBuilderSendTrx).toHaveBeenCalledWith(
      "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
      1000,
      "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
    );
    expect(result).toEqual({ raw_data: { contract: [] } });
  });
});
