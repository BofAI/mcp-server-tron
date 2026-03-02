import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTronWeb } from "../../../src/core/services/clients.js";
import {
  getApprovedList,
  getBandwidthPrices,
  getBlockBalance,
  getBlockByLatestNum,
  getBlockByLimitNext,
  getBurnTrx,
  getEnergyPrices,
  getTransactionInfoByBlockNum,
} from "../../../src/core/services/query";

vi.mock("../../../src/core/services/clients.js", () => {
  return {
    getTronWeb: vi.fn(),
  };
});

describe("services/query", () => {
  const fullNodeRequest = vi.fn();
  const trxGetApprovedList = vi.fn();
  const trxGetEnergyPrices = vi.fn();
  const trxGetBandwidthPrices = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (getTronWeb as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      fullNode: {
        request: fullNodeRequest,
      },
      trx: {
        getApprovedList: trxGetApprovedList,
        getEnergyPrices: trxGetEnergyPrices,
        getBandwidthPrices: trxGetBandwidthPrices,
      },
    });
  });

  it("getBlockByLatestNum should call fullNode.request with wallet/getblockbylatestnum", async () => {
    fullNodeRequest.mockResolvedValueOnce({ ok: true });

    const result = await getBlockByLatestNum(3, "nile");

    expect(getTronWeb).toHaveBeenCalledWith("nile");
    expect(fullNodeRequest).toHaveBeenCalledWith("wallet/getblockbylatestnum", { num: 3 }, "post");
    expect(result).toEqual({ ok: true });
  });

  it("getBlockByLimitNext should call fullNode.request with wallet/getblockbylimitnext", async () => {
    fullNodeRequest.mockResolvedValueOnce({ block: [] });

    const result = await getBlockByLimitNext(100, 110, "mainnet");

    expect(getTronWeb).toHaveBeenCalledWith("mainnet");
    expect(fullNodeRequest).toHaveBeenCalledWith(
      "wallet/getblockbylimitnext",
      { startNum: 100, endNum: 110 },
      "post",
    );
    expect(result).toEqual({ block: [] });
  });

  it("getBlockBalance should call fullNode.request with wallet/getblockbalance and visible=true", async () => {
    fullNodeRequest.mockResolvedValueOnce({ balances: [] });

    const result = await getBlockBalance("abcd", 123, "shasta");

    expect(getTronWeb).toHaveBeenCalledWith("shasta");
    expect(fullNodeRequest).toHaveBeenCalledWith(
      "wallet/getblockbalance",
      { hash: "abcd", number: 123, visible: true },
      "post",
    );
    expect(result).toEqual({ balances: [] });
  });

  it("getTransactionInfoByBlockNum should call fullNode.request with wallet/gettransactioninfobyblocknum", async () => {
    fullNodeRequest.mockResolvedValueOnce([{ id: "tx" }]);

    const result = await getTransactionInfoByBlockNum(42, "nile");

    expect(getTronWeb).toHaveBeenCalledWith("nile");
    expect(fullNodeRequest).toHaveBeenCalledWith(
      "wallet/gettransactioninfobyblocknum",
      { num: 42 },
      "post",
    );
    expect(result).toEqual([{ id: "tx" }]);
  });

  it("getApprovedList should call tronWeb.trx.getApprovedList", async () => {
    trxGetApprovedList.mockResolvedValueOnce({ approved_list: ["T..."] });

    const tx = { raw_data: {} };
    const result = await getApprovedList(tx, "mainnet");

    expect(getTronWeb).toHaveBeenCalledWith("mainnet");
    expect(trxGetApprovedList).toHaveBeenCalledWith(tx);
    expect(result).toEqual({ approved_list: ["T..."] });
  });

  it("getEnergyPrices should call tronWeb.trx.getEnergyPrices", async () => {
    trxGetEnergyPrices.mockResolvedValueOnce("prices");

    const result = await getEnergyPrices("nile");

    expect(getTronWeb).toHaveBeenCalledWith("nile");
    expect(trxGetEnergyPrices).toHaveBeenCalledWith();
    expect(result).toBe("prices");
  });

  it("getBandwidthPrices should call tronWeb.trx.getBandwidthPrices", async () => {
    trxGetBandwidthPrices.mockResolvedValueOnce("prices");

    const result = await getBandwidthPrices("nile");

    expect(getTronWeb).toHaveBeenCalledWith("nile");
    expect(trxGetBandwidthPrices).toHaveBeenCalledWith();
    expect(result).toBe("prices");
  });

  it("getBurnTrx should call fullNode.request with wallet/getburntrx", async () => {
    fullNodeRequest.mockResolvedValueOnce({ burnTrx: "1" });

    const result = await getBurnTrx("mainnet");

    expect(getTronWeb).toHaveBeenCalledWith("mainnet");
    expect(fullNodeRequest).toHaveBeenCalledWith("wallet/getburntrx", {}, "post");
    expect(result).toEqual({ burnTrx: "1" });
  });
});
