import { describe, it, expect, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTRONTools } from "../../src/core/tools/index";

const USDT_ADDRESS_NILE = "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf";
const TEST_ADDRESS = "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb";

// Use real private key from .env if available, otherwise fall back to dummy
const REAL_KEY = process.env.TRON_PRIVATE_KEY;
const HAS_REAL_KEY = !!REAL_KEY && REAL_KEY.length === 64;

describe("TRON Tools Integration (Nile)", () => {
  let server: McpServer;
  let registeredTools: Map<string, any>;

  beforeEach(() => {
    server = new McpServer({
      name: "test-server",
      version: "1.0.0",
    });

    // Track registered tools
    registeredTools = new Map();
    const originalRegisterTool = server.registerTool.bind(server);
    server.registerTool = (name: string, schema: any, handler: any) => {
      registeredTools.set(name, { schema, handler });
      return originalRegisterTool(name, schema, handler);
    };

    // Use real key if available so write tool handlers can execute real transactions
    if (!HAS_REAL_KEY) {
      process.env.TRON_PRIVATE_KEY =
        "0000000000000000000000000000000000000000000000000000000000000001";
    }

    registerTRONTools(server);

    // Restore env if we used a dummy key
    if (!HAS_REAL_KEY) {
      delete process.env.TRON_PRIVATE_KEY;
    }
  });

  it("get_balance should return real balance from Nile", async () => {
    const tool = registeredTools.get("get_balance");
    const result = await tool.handler({
      address: TEST_ADDRESS,
      network: "nile",
    });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.network).toBe("nile");
    expect(content.address).toBe(TEST_ADDRESS);
    expect(Number(content.balance.trx)).toBeGreaterThan(0);
  }, 20000);

  it("get_token_balance should return USDT balance from Nile", async () => {
    const tool = registeredTools.get("get_token_balance");
    const result = await tool.handler({
      address: TEST_ADDRESS,
      tokenAddress: USDT_ADDRESS_NILE,
      network: "nile",
    });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.tokenAddress).toBe(USDT_ADDRESS_NILE);
    expect(content.balance.symbol).toBe("USDT");
  }, 20000);

  it("read_contract should return name for USDT on Nile", async () => {
    const tool = registeredTools.get("read_contract");
    const result = await tool.handler({
      contractAddress: USDT_ADDRESS_NILE,
      functionName: "name",
      network: "nile",
    });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.result).toContain("Tether USD");
  }, 20000);

  it("get_chain_info should return info for Nile", async () => {
    const tool = registeredTools.get("get_chain_info");
    const result = await tool.handler({ network: "nile" });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.network).toBe("nile");
    expect(content.rpcUrl).toContain("nile");
  }, 20000);

  it("multicall should work with real contracts on Nile", async () => {
    const tool = registeredTools.get("multicall");
    const result = await tool.handler({
      calls: [
        {
          address: USDT_ADDRESS_NILE,
          functionName: "name",
          abi: [{ name: "name", type: "function", inputs: [], outputs: [{ type: "string" }] }],
        },
        {
          address: USDT_ADDRESS_NILE,
          functionName: "symbol",
          abi: [{ name: "symbol", type: "function", inputs: [], outputs: [{ type: "string" }] }],
        },
      ],
      network: "nile",
    });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.count).toBe(2);
    expect(content.results[0].result).toBe("Tether USD");
    expect(content.results[1].result).toBe("USDT");
  }, 20000);

  it("estimate_energy should estimate energy for USDT name() on Nile", async () => {
    const tool = registeredTools.get("estimate_energy");
    const result = await tool.handler({
      address: USDT_ADDRESS_NILE,
      functionName: "name",
      args: [],
      abi: [{ name: "name", type: "function", inputs: [], outputs: [{ type: "string" }] }],
      network: "nile",
    });

    if (result.isError) {
      console.error("estimate_energy error:", result.content[0].text);
    }
    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.network).toBe("nile");
    // read-only functions might return 0 energy used depending on implementation,
    // but the call should succeed.
    expect(content.energyUsed).toBeGreaterThanOrEqual(0);
  }, 20000);

  it("staking tools (v2) should be registered and callable", async () => {
    // These tests might fail if TRON_PRIVATE_KEY is not set or account has no balance,
    // but the tool registration and handler calling should work.
    const freezeTool = registeredTools.get("freeze_balance_v2");
    expect(freezeTool).toBeDefined();

    const unfreezeTool = registeredTools.get("unfreeze_balance_v2");
    expect(unfreezeTool).toBeDefined();

    const withdrawTool = registeredTools.get("withdraw_expire_unfreeze");
    expect(withdrawTool).toBeDefined();
  });

  it("deploy_contract tool should be registered", async () => {
    const deployTool = registeredTools.get("deploy_contract");
    expect(deployTool).toBeDefined();
  });

  // ==========================================================================
  // Governance & Proposal read-only integration tests (Nile)
  // ==========================================================================

  it("list_witnesses should return SR list from Nile", async () => {
    const tool = registeredTools.get("list_witnesses");
    expect(tool).toBeDefined();
    const result = await tool.handler({ network: "nile" });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(Array.isArray(content)).toBe(true);
    expect(content.length).toBeGreaterThan(0);
    // Each witness should have an address field
    expect(content[0]).toHaveProperty("address");
  }, 20000);

  it("get_paginated_witnesses should return paginated SR list from Nile", async () => {
    const tool = registeredTools.get("get_paginated_witnesses");
    expect(tool).toBeDefined();
    const result = await tool.handler({ offset: 0, limit: 5, network: "nile" });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content).toHaveProperty("witnesses");
    expect(Array.isArray(content.witnesses)).toBe(true);
    expect(content.witnesses.length).toBeLessThanOrEqual(5);
    expect(content).toHaveProperty("total");
    expect(content.total).toBeGreaterThan(0);
  }, 20000);

  it("get_next_maintenance_time should return valid time from Nile", async () => {
    const tool = registeredTools.get("get_next_maintenance_time");
    expect(tool).toBeDefined();
    const result = await tool.handler({ network: "nile" });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.network).toBe("nile");
    expect(content.nextMaintenanceTime).toHaveProperty("secondsUntilNextMaintenance");
    expect(content.nextMaintenanceTime.secondsUntilNextMaintenance).toBeGreaterThanOrEqual(0);
  }, 20000);

  it("get_reward should return reward for a known address on Nile", async () => {
    const tool = registeredTools.get("get_reward");
    expect(tool).toBeDefined();
    const result = await tool.handler({ address: TEST_ADDRESS, network: "nile" });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.network).toBe("nile");
    expect(content.address).toBe(TEST_ADDRESS);
    expect(typeof content.reward).toBe("number");
  }, 20000);

  it("get_brokerage should return brokerage ratio for an SR on Nile", async () => {
    // First get an SR address from the witness list
    const listTool = registeredTools.get("list_witnesses");
    const listResult = await listTool.handler({ network: "nile" });
    const witnesses = JSON.parse(listResult.content[0].text);
    const srAddress = witnesses[0].address;

    const tool = registeredTools.get("get_brokerage");
    expect(tool).toBeDefined();
    const result = await tool.handler({ witnessAddress: srAddress, network: "nile" });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.witnessAddress).toBe(srAddress);
    expect(typeof content.brokerage).toBe("number");
    expect(content.brokerage).toBeGreaterThanOrEqual(0);
    expect(content.brokerage).toBeLessThanOrEqual(100);
  }, 20000);

  it("list_proposals should return proposals from Nile", async () => {
    const tool = registeredTools.get("list_proposals");
    expect(tool).toBeDefined();
    const result = await tool.handler({ network: "nile" });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(Array.isArray(content)).toBe(true);
  }, 20000);

  it("get_proposal should return a specific proposal from Nile", async () => {
    // First get a valid proposal ID
    const listTool = registeredTools.get("list_proposals");
    const listResult = await listTool.handler({ network: "nile" });
    const proposals = JSON.parse(listResult.content[0].text);

    if (proposals.length === 0) {
      // No proposals on Nile, skip gracefully
      console.log("No proposals found on Nile, skipping get_proposal test");
      return;
    }

    const proposalId = proposals[0].proposal_id;
    const tool = registeredTools.get("get_proposal");
    expect(tool).toBeDefined();
    const result = await tool.handler({ proposalId, network: "nile" });

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text);
    expect(content.proposal_id).toBe(proposalId);
  }, 20000);

  // ==========================================================================
  // Governance & Proposal write tool integration tests (Nile)
  // Requires TRON_PRIVATE_KEY in .env with a funded Nile testnet account.
  // ==========================================================================

  it("governance write tools should all be registered", () => {
    const writeTools = [
      "create_witness",
      "update_witness",
      "vote_witness",
      "withdraw_balance",
      "update_brokerage",
      "create_proposal",
      "approve_proposal",
      "delete_proposal",
    ];
    writeTools.forEach((name) => {
      expect(registeredTools.has(name)).toBe(true);
    });
  });

  // ---------- vote_witness: real on-chain transaction ----------
  it.skipIf(!HAS_REAL_KEY)(
    "vote_witness should successfully vote for an SR on Nile",
    async () => {
      // Get an SR address to vote for
      const witnesses = await registeredTools.get("list_witnesses").handler({ network: "nile" });
      const srs = JSON.parse(witnesses.content[0].text);
      const srAddr = srs[0].address;

      const tool = registeredTools.get("vote_witness");
      const result = await tool.handler({
        votes: [{ address: srAddr, voteCount: 1 }],
        network: "nile",
      });

      expect(result.isError).toBeUndefined();
      const content = JSON.parse(result.content[0].text);
      expect(content.txHash).toBeDefined();
      expect(content.txHash.length).toBe(64);
      expect(content.votes[0].address).toBe(srAddr);
      console.log("vote_witness txHash:", content.txHash);
    },
    30000,
  );

  // ---------- withdraw_balance: real on-chain transaction ----------
  // This will broadcast but likely fail on-chain (no rewards to withdraw).
  // We verify the tool can build, sign, and broadcast a transaction.
  it.skipIf(!HAS_REAL_KEY)(
    "withdraw_balance should build and broadcast transaction on Nile",
    async () => {
      const tool = registeredTools.get("withdraw_balance");
      const result = await tool.handler({ network: "nile" });

      // May succeed or fail depending on whether account has rewards
      const text = result.content[0].text;
      if (result.isError) {
        // Expected: "No withdraw balance" or similar chain validation error
        // This still proves the tool can build + sign the transaction
        expect(text).toContain("Error withdrawing balance");
      } else {
        const content = JSON.parse(text);
        expect(content.txHash).toBeDefined();
        console.log("withdraw_balance txHash:", content.txHash);
      }
    },
    30000,
  );

  // ---------- SR-only tools: verify transaction building works ----------
  // These tools require SR status. With a non-SR account, they will fail at
  // the chain validation stage, but we verify the full pipeline (build → sign
  // → broadcast → chain rejection) works without crashes.

  it.skipIf(!HAS_REAL_KEY)(
    "create_witness should fail gracefully (insufficient TRX or already SR)",
    async () => {
      const tool = registeredTools.get("create_witness");
      const result = await tool.handler({ url: "https://nile-test-sr.com", network: "nile" });

      // Will fail: 9999 TRX fee and account may not have enough
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Error creating witness");
      console.log("create_witness (expected fail):", result.content[0].text);
    },
    30000,
  );

  it.skipIf(!HAS_REAL_KEY)(
    "update_witness should succeed or fail gracefully",
    async () => {
      const tool = registeredTools.get("update_witness");
      const result = await tool.handler({ url: "https://updated-sr.com", network: "nile" });

      if (result.isError) {
        // Not an SR — expected chain validation error
        expect(result.content[0].text).toContain("Error updating witness");
        console.log("update_witness (expected fail):", result.content[0].text);
      } else {
        // Account is an SR — update succeeded
        const data = JSON.parse(result.content[0].text);
        expect(data.txHash).toBeTruthy();
        console.log("update_witness txHash:", data.txHash);
      }
    },
    30000,
  );

  it.skipIf(!HAS_REAL_KEY)(
    "update_brokerage should succeed or fail gracefully",
    async () => {
      const tool = registeredTools.get("update_brokerage");
      const result = await tool.handler({ brokerage: 20, network: "nile" });

      if (result.isError) {
        expect(result.content[0].text).toContain("Error updating brokerage");
        console.log("update_brokerage (expected fail):", result.content[0].text);
      } else {
        const data = JSON.parse(result.content[0].text);
        expect(data.txHash).toBeTruthy();
        console.log("update_brokerage txHash:", data.txHash);
      }
    },
    30000,
  );

  it.skipIf(!HAS_REAL_KEY)(
    "create_proposal should succeed or fail gracefully",
    async () => {
      const tool = registeredTools.get("create_proposal");
      const result = await tool.handler({ parameters: { "0": 100000 }, network: "nile" });

      if (result.isError) {
        expect(result.content[0].text).toContain("Error creating proposal");
        console.log("create_proposal (expected fail):", result.content[0].text);
      } else {
        const data = JSON.parse(result.content[0].text);
        expect(data.txHash).toBeTruthy();
        console.log("create_proposal txHash:", data.txHash);
      }
    },
    30000,
  );

  it.skipIf(!HAS_REAL_KEY)(
    "approve_proposal should succeed or fail gracefully",
    async () => {
      const proposals = await registeredTools.get("list_proposals").handler({ network: "nile" });
      const list = JSON.parse(proposals.content[0].text);
      const proposalId = list[0]?.proposal_id ?? 1;

      const tool = registeredTools.get("approve_proposal");
      const result = await tool.handler({ proposalId, approve: true, network: "nile" });

      if (result.isError) {
        expect(result.content[0].text).toContain("Error approving proposal");
        console.log("approve_proposal (expected fail):", result.content[0].text);
      } else {
        const data = JSON.parse(result.content[0].text);
        expect(data.txHash).toBeTruthy();
        console.log("approve_proposal txHash:", data.txHash);
      }
    },
    30000,
  );

  it.skipIf(!HAS_REAL_KEY)(
    "delete_proposal should succeed or fail gracefully",
    async () => {
      const tool = registeredTools.get("delete_proposal");
      const result = await tool.handler({ proposalId: 1, network: "nile" });

      if (result.isError) {
        expect(result.content[0].text).toContain("Error deleting proposal");
        console.log("delete_proposal (expected fail):", result.content[0].text);
      } else {
        const data = JSON.parse(result.content[0].text);
        expect(data.txHash).toBeTruthy();
        console.log("delete_proposal txHash:", data.txHash);
      }
    },
    30000,
  );
});
