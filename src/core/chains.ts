// Tron Network Definitions

export enum TronNetwork {
  Mainnet = "mainnet",
  Nile = "nile",
  Shasta = "shasta",
}

export interface NetworkConfig {
  name: string;
  fullNode: string;
  solidityNode: string;
  eventServer: string;
  explorer: string;
}

const FALLBACK_MAINNET_HOST = "https://tg.ops.sunpump.xyz";

function isTronGridApiKeyConfigured(): boolean {
  const apiKey = process.env.TRONGRID_API_KEY;
  return typeof apiKey === "string" && apiKey.length > 0;
}

export const NETWORKS: Record<TronNetwork, NetworkConfig> = {
  [TronNetwork.Mainnet]: {
    name: "Mainnet",
    fullNode: "https://api.trongrid.io",
    solidityNode: "https://api.trongrid.io",
    eventServer: "https://api.trongrid.io",
    explorer: "https://tronscan.org",
  },
  [TronNetwork.Nile]: {
    name: "Nile",
    fullNode: "https://nile.trongrid.io",
    solidityNode: "https://nile.trongrid.io",
    eventServer: "https://nile.trongrid.io",
    explorer: "https://nile.tronscan.org",
  },
  [TronNetwork.Shasta]: {
    name: "Shasta",
    fullNode: "https://api.shasta.trongrid.io",
    solidityNode: "https://api.shasta.trongrid.io",
    eventServer: "https://api.shasta.trongrid.io",
    explorer: "https://shasta.tronscan.org",
  },
};

export const DEFAULT_NETWORK = TronNetwork.Mainnet;

export function getNetworkConfig(network: string = DEFAULT_NETWORK): NetworkConfig {
  const normalizedNetwork = network.toLowerCase();

  // Direct match
  if (Object.values(TronNetwork).includes(normalizedNetwork as TronNetwork)) {
    const resolved = normalizedNetwork as TronNetwork;
    if (resolved === TronNetwork.Mainnet && !isTronGridApiKeyConfigured()) {
      return {
        ...NETWORKS[TronNetwork.Mainnet],
        fullNode: FALLBACK_MAINNET_HOST,
        solidityNode: FALLBACK_MAINNET_HOST,
        eventServer: FALLBACK_MAINNET_HOST,
      };
    }
    return NETWORKS[resolved];
  }

  // Aliases
  if (
    normalizedNetwork === "tron" ||
    normalizedNetwork === "trx" ||
    normalizedNetwork === "mainnet"
  ) {
    if (!isTronGridApiKeyConfigured()) {
      return {
        ...NETWORKS[TronNetwork.Mainnet],
        fullNode: FALLBACK_MAINNET_HOST,
        solidityNode: FALLBACK_MAINNET_HOST,
        eventServer: FALLBACK_MAINNET_HOST,
      };
    }
    return NETWORKS[TronNetwork.Mainnet];
  }
  if (normalizedNetwork === "testnet") {
    return NETWORKS[TronNetwork.Nile]; // Default testnet to Nile
  }

  throw new Error(`Unsupported network: ${network}`);
}

export function getSupportedNetworks(): string[] {
  return Object.values(TronNetwork);
}

export function getRpcUrl(network: string = DEFAULT_NETWORK): string {
  return getNetworkConfig(network).fullNode;
}
