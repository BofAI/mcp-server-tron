import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TronWeb } from "tronweb";
import { readContract } from "../../../src/core/services/contracts.js";

const { getClient } = vi.hoisted(() => ({ getClient: vi.fn() }));
vi.mock("../../../src/core/services/clients.js", () => ({ getTronWeb: getClient }));

const ADDRESS = "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb";
const OTHER_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

describe("contract reads with TronWeb 6.5.2", () => {
  let client: TronWeb;

  beforeEach(() => {
    client = new TronWeb({ fullHost: "https://rpc.example" });
    client.setAddress(ADDRESS);
    getClient.mockReturnValue(client);
    vi.spyOn(client.fullNode, "request").mockResolvedValue({
      result: { result: true },
      constant_result: ["2a".padStart(64, "0")],
    });
  });
  afterEach(() => vi.restoreAllMocks());

  function abi(type?: string) {
    return [
      {
        type: "function",
        name: "read",
        inputs: type ? [{ name: "value", type }] : [],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
      },
    ];
  }

  it("returns decoded data for a valid view call", async () => {
    const result = await readContract({ address: ADDRESS, functionName: "read", abi: abi() });
    expect(result).toBe(42n);
    expect(client.fullNode.request).toHaveBeenCalledWith(
      "wallet/triggerconstantcontract",
      expect.objectContaining({ contract_address: client.address.toHex(ADDRESS) }),
      "post",
    );
  });

  it.each(["string", "bool"])("rejects an omitted %s argument before RPC", async (type) => {
    await expect(
      readContract({ address: ADDRESS, functionName: "read", abi: abi(type) }),
    ).rejects.toThrow(
      "Read contract failed: Invalid arguments provided: expected 1 arguments, got 0",
    );
    expect(client.fullNode.request).not.toHaveBeenCalled();
  });

  it("rejects extra arguments before RPC", async () => {
    await expect(
      readContract({ address: ADDRESS, functionName: "read", abi: abi(), args: [true] }),
    ).rejects.toThrow(
      "Read contract failed: Invalid arguments provided: expected 0 arguments, got 1",
    );
    expect(client.fullNode.request).not.toHaveBeenCalled();
  });

  it("rejects node metadata for a different contract address", async () => {
    vi.spyOn(client.trx, "getContract").mockResolvedValue({
      contract_address: client.address.toHex(OTHER_ADDRESS),
      abi: { entrys: abi() },
    } as Awaited<ReturnType<typeof client.trx.getContract>>);
    await expect(readContract({ address: ADDRESS, functionName: "read" })).rejects.toThrow(
      "Invalid contract address provided",
    );
    expect(client.fullNode.request).not.toHaveBeenCalled();
  });
});
