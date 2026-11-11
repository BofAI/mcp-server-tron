import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getNetworkConfig,
  getRpcUrl,
  getSupportedNetworks,
  TronNetwork,
  NETWORKS,
} from "../../src/core/chains.js";

describe("Chains", () => {
  const FALLBACK_MAINNET_HOST = "https://hptg.bankofai.io";
  beforeEach(() => {
    vi.stubEnv("TRONGRID_API_KEY", undefined);
    vi.stubEnv("MCP_MAINNET_RPC_URL", undefined);
  });
  afterEach(() => vi.unstubAllEnvs());
  const setEnv = (value: string | undefined) => {
    if (value === undefined) {
      delete process.env.TRONGRID_API_KEY;
    } else {
      process.env.TRONGRID_API_KEY = value;
    }
  };

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

  it.each(["mainnet", "tron", "trx", "MAINNET"])(
    "should prioritize a deployment RPC override for %s",
    (network) => {
      vi.stubEnv("MCP_MAINNET_RPC_URL", " https://tg.ops.sunpump.xyz/ ");
      setEnv("dummy_key");
      const config = getNetworkConfig(network);
      expect(config.fullNode).toBe("https://tg.ops.sunpump.xyz");
      expect(config.solidityNode).toBe(config.fullNode);
      expect(config.eventServer).toBe(config.fullNode);
      expect(getRpcUrl(network)).toBe(config.fullNode);
    },
  );

  it("should leave testnets unchanged when a mainnet override is configured", () => {
    vi.stubEnv("MCP_MAINNET_RPC_URL", "https://tg.ops.sunpump.xyz");
    expect(getNetworkConfig("nile")).toEqual(NETWORKS.nile);
    expect(getNetworkConfig("testnet")).toEqual(NETWORKS.nile);
    expect(getNetworkConfig("shasta")).toEqual(NETWORKS.shasta);
  });

  it("should ignore an empty override and retain default selection", () => {
    vi.stubEnv("MCP_MAINNET_RPC_URL", "   ");
    expect(getRpcUrl()).toBe(FALLBACK_MAINNET_HOST);
    setEnv("dummy_key");
    expect(getRpcUrl()).toBe("https://api.trongrid.io");
  });

  it("should support an operator-configured HTTP RPC base path", () => {
    vi.stubEnv("MCP_MAINNET_RPC_URL", "http://localhost:8090/rpc/");
    expect(getRpcUrl()).toBe("http://localhost:8090/rpc");
  });

  it.each([
    "not-a-url",
    "ftp://rpc.example",
    "file:///tmp/rpc",
    "https://user:password@rpc.example",
    "https://rpc.example?key=value",
    "https://rpc.example#fragment",
  ])("should reject invalid or ambiguous RPC override %s", (url) => {
    vi.stubEnv("MCP_MAINNET_RPC_URL", url);
    expect(() => getNetworkConfig()).toThrow("MCP_MAINNET_RPC_URL");
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
