import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { clientOptions } = vi.hoisted(() => ({ clientOptions: vi.fn() }));

vi.mock("tronweb", () => ({
  TronWeb: class {
    constructor(options: unknown) {
      clientOptions(options);
    }
    setAddress = vi.fn();
  },
}));

describe("RPC client credentials", () => {
  beforeEach(() => {
    vi.resetModules();
    clientOptions.mockClear();
    vi.stubEnv("MCP_MAINNET_RPC_URL", undefined);
    vi.stubEnv("TRONGRID_API_KEY", "test-api-key");
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each(["mainnet", "nile", "shasta"])(
    "sends the credential to the official %s TronGrid endpoint",
    async (network) => {
      const { getTronWeb } = await import("../../../src/core/services/clients.js");
      getTronWeb(network);
      expect(clientOptions.mock.calls[0][0].headers).toEqual({
        "TRON-PRO-API-KEY": "test-api-key",
      });
    },
  );

  it.each([
    "https://tg.ops.sunpump.xyz",
    "https://api.trongrid.io.attacker.example",
    "http://api.trongrid.io",
    "https://api.trongrid.io:8443",
  ])("does not disclose the credential to custom RPC %s", async (url) => {
    vi.stubEnv("MCP_MAINNET_RPC_URL", url);
    const { getTronWeb } = await import("../../../src/core/services/clients.js");
    getTronWeb();
    expect(clientOptions.mock.calls[0][0]).toMatchObject({ fullHost: url });
    expect(clientOptions.mock.calls[0][0].headers).toBeUndefined();
  });

  it("does not add a credential when none is configured", async () => {
    vi.stubEnv("TRONGRID_API_KEY", undefined);
    const { getTronWeb } = await import("../../../src/core/services/clients.js");
    getTronWeb();
    expect(clientOptions.mock.calls[0][0]).toMatchObject({
      fullHost: "https://hptg.bankofai.io",
    });
    expect(clientOptions.mock.calls[0][0].headers).toBeUndefined();
  });
});
