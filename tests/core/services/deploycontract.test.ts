import { describe, it, expect } from "vitest";
import { deployContract, readContract } from "../../../src/core/services/contracts";

// Simple Storage Contract Bytecode & ABI
// Minimal "get-only" contract ABI
const SIMPLE_STORAGE_ABI = [
  {
    inputs: [],
    name: "get",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

// Verified simple bytecode for a contract that returns 0 on get()
const SIMPLE_STORAGE_BYTECODE =
  "6080604052348015600f57600080fd5b5060ac80601d6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806360fe47b11460375780636d4ce63c146049575b600080fd5b60476042366004605e565b600055565b005b60005460405190815260200160405180910390f35b600060208284031215606f57600080fd5b503591905056fea2646970667358221220ad46ce342d88ac7c6680183acf9cb99fab4db939a9c45b30036ea6f4da69bf2264736f6c63430008190033";

describe("Contract Services Integration (Nile)", () => {
  // Only run if wallet is configured (agent-wallet or legacy env vars)
  const hasWallet = !!process.env.TRON_PRIVATE_KEY || !!process.env.TRON_MNEMONIC
    || !!(process.env.AGENT_WALLET_DIR && process.env.AGENT_WALLET_PASSWORD);

  it.runIf(hasWallet)(
    "should deploy a simple storage contract",
    async () => {
      console.log("Deploying contract to Nile...");
      const result = await deployContract(
        {
          abi: SIMPLE_STORAGE_ABI,
          bytecode: SIMPLE_STORAGE_BYTECODE,
          name: "SimpleStorageTest",
          feeLimit: 100_000_000, // 100 TRX
        },
        "nile",
      );

      expect(result.txID).toBeDefined();
      expect(result.contractAddress).toBeDefined();
      console.log(`Deployed to: ${result.contractAddress}, txID: ${result.txID}`);

      const value = await readContract(
        {
          address: result.contractAddress as string,
          functionName: "get",
          abi: SIMPLE_STORAGE_ABI,
        },
        "nile",
      );

      // The bytecode above initializes storage to 0 by default
      expect(value.toString()).toBe("0");
    },
    90000,
  );
});
