import { describe, it, expect } from "vitest";
import {
  listProposals,
  getProposalById,
  createProposal,
  approveProposal,
  deleteProposal,
} from "../../../src/core/services/proposals.js";

describe("Proposals Services Integration (Nile)", () => {
  const hasWallet = !!process.env.TRON_PRIVATE_KEY || !!process.env.TRON_MNEMONIC
    || !!(process.env.AGENT_WALLET_DIR && process.env.AGENT_WALLET_PASSWORD);

  // ============================================================================
  // READ-ONLY TESTS
  // ============================================================================

  it("listProposals should return proposals array", async () => {
    const proposals = await listProposals("nile");
    expect(proposals).toBeDefined();
    // May be empty on testnet
    if (Array.isArray(proposals)) {
      console.log(`Found ${proposals.length} proposals on Nile`);
    } else {
      console.log("listProposals result:", typeof proposals);
    }
  }, 20000);

  it("getProposalById should return proposal or throw for invalid ID", async () => {
    try {
      const proposal = await getProposalById(1, "nile");
      expect(proposal).toBeDefined();
      console.log("Proposal #1:", JSON.stringify(proposal).slice(0, 200));
    } catch (error: any) {
      // Proposal #1 might not exist on Nile
      console.log("getProposalById feedback:", error.message);
      expect(error.message).toContain("Failed to get proposal");
    }
  }, 20000);

  // ============================================================================
  // WRITE TESTS (require private key, SR-only operations)
  // ============================================================================

  it.runIf(hasWallet)(
    "createProposal should attempt to create proposal and return error or tx hash",
    async () => {
      try {
        // Chain parameter 0 = MaintenanceTimeInterval
        const txHash = await createProposal({ 0: 6000 }, "nile");
        expect(typeof txHash).toBe("string");
        console.log(`createProposal Tx ID: ${txHash}`);
      } catch (error: any) {
        // Expected to fail — only SRs can create proposals
        console.log("Proposals (createProposal) integration feedback:", error.message);
        expect(error.message).toContain("Failed to create proposal");
      }
    },
    30000,
  );

  it.runIf(hasWallet)(
    "approveProposal should attempt to vote on proposal and return error or tx hash",
    async () => {
      try {
        const txHash = await approveProposal(1, true, "nile");
        expect(typeof txHash).toBe("string");
        console.log(`approveProposal Tx ID: ${txHash}`);
      } catch (error: any) {
        // Expected to fail — proposal may not exist or account is not an SR
        console.log("Proposals (approveProposal) integration feedback:", error.message);
        expect(error.message).toContain("Failed to approve proposal");
      }
    },
    30000,
  );

  it.runIf(hasWallet)(
    "deleteProposal should attempt to delete proposal and return error or tx hash",
    async () => {
      try {
        const txHash = await deleteProposal(999999, "nile");
        expect(typeof txHash).toBe("string");
        console.log(`deleteProposal Tx ID: ${txHash}`);
      } catch (error: any) {
        // Expected to fail — only proposal creator can delete
        console.log("Proposals (deleteProposal) integration feedback:", error.message);
        expect(error.message).toContain("Failed to delete proposal");
      }
    },
    30000,
  );
});
