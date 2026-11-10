import { describe, expect, it, afterAll } from "vitest";
import {
  getNetworkConfig,
  getRpcUrl,
  getSupportedNetworks,
  TronNetwork,
  NETWORKS,
} from "../../src/core/chains";

describe("Chains", () => {
  const FALLBACK_MAINNET_HOST = "https://tg.ops.sunpump.xyz";
  const originalTronGridApiKey = process.env.TRONGRID_API_KEY;
  const setEnv = (value: string | undefined) => {
    if (value === undefined) {
      delete process.env.TRONGRID_API_KEY;
    } else {
      process.env.TRONGRID_API_KEY = value;
    }
  };

  afterAll(() => {
    if (originalTronGridApiKey === undefined) {
      delete process.env.TRONGRID_API_KEY;
    } else {
      process.env.TRONGRID_API_KEY = originalTronGridApiKey;
    }
  });

  it("should export supported networks", () => {
    const networks = getSupportedNetworks();
    expect(networks).toEqual(["mainnet", "nile", "shasta"]);
  });

  it("should use fallback host for mainnet when TRONGRID_API_KEY not set", () => {
    setEnv(undefined);
    const config = getNetworkConfig(TronNetwork.Mainnet);
    expect(config.name).toBe("Mainnet");
    expect(config.fullNode).toBe(FALLBACK_MAINNET_HOST);
    expect(config.solidityNode).toBe(FALLBACK_MAINNET_HOST);
    expect(config.eventServer).toBe(FALLBACK_MAINNET_HOST);
  });

  it("should use api.trongrid.io for mainnet when TRONGRID_API_KEY is set", () => {
    setEnv("dummy_key");
    const config = getNetworkConfig(TronNetwork.Mainnet);
    expect(config.name).toBe("Mainnet");
    expect(config.fullNode).toBe("https://api.trongrid.io");
  });

  it("should get network config for nile", () => {
    setEnv(undefined);
    const config = getNetworkConfig(TronNetwork.Nile);
    expect(config.name).toBe("Nile");
    expect(config.fullNode).toBe("https://nile.trongrid.io");
  });

  it("should get network config for shasta", () => {
    setEnv(undefined);
    const config = getNetworkConfig(TronNetwork.Shasta);
    expect(config.name).toBe("Shasta");
    expect(config.fullNode).toBe("https://api.shasta.trongrid.io");
  });

  it("should resolve aliases correctly", () => {
    setEnv(undefined);
    const mainnet = getNetworkConfig("tron");
    expect(mainnet.fullNode).toBe(FALLBACK_MAINNET_HOST);
    const mainnetAlias = getNetworkConfig("trx");
    expect(mainnetAlias.fullNode).toBe(FALLBACK_MAINNET_HOST);
    expect(getNetworkConfig("testnet")).toBe(NETWORKS[TronNetwork.Nile]);
  });

  it("should return correct RPC URL", () => {
    setEnv(undefined);
    expect(getRpcUrl("mainnet")).toBe(FALLBACK_MAINNET_HOST);
    expect(getRpcUrl("nile")).toBe("https://nile.trongrid.io");
  });

  it("should throw error for unsupported network", () => {
    expect(() => getNetworkConfig("invalid_network")).toThrow(
      "Unsupported network: invalid_network",
    );
  });

  it("should use default network if none provided", () => {
    setEnv(undefined);
    const config = getNetworkConfig();
    expect(config.name).toBe("Mainnet");
    expect(config.fullNode).toBe(FALLBACK_MAINNET_HOST);
  });
});
