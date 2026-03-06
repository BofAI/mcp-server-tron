import { getTronWeb } from "./clients.js";
import { getOwnerAddress, buildSignBroadcast } from "./agent-wallet.js";

// ============================================================================
// PROPOSAL READ OPERATIONS
// ============================================================================

/**
 * List all network proposals
 * @param network Network name (mainnet, nile, shasta)
 */
export async function listProposals(network = "mainnet"): Promise<unknown> {
  const tronWeb = getTronWeb(network);
  try {
    const proposals = await tronWeb.trx.listProposals();
    return proposals;
  } catch (error: any) {
    throw new Error(`Failed to list proposals: ${error.message}`);
  }
}

/**
 * Get a specific proposal by its ID
 * @param proposalId The proposal ID (number)
 * @param network Network name
 */
export async function getProposalById(proposalId: number, network = "mainnet"): Promise<unknown> {
  const tronWeb = getTronWeb(network);
  try {
    const proposal = await tronWeb.trx.getProposal(proposalId);
    return proposal;
  } catch (error: any) {
    throw new Error(`Failed to get proposal #${proposalId}: ${error.message}`);
  }
}

// ============================================================================
// PROPOSAL WRITE OPERATIONS (SR only)
// ============================================================================

/**
 * Create a new network proposal (SR only)
 * @param parameters Object mapping chain parameter keys (number) to their proposed values (number)
 * @param network Network name
 * @returns Transaction hash
 */
export async function createProposal(
  parameters: Record<number, number>,
  network = "mainnet",
): Promise<string> {
  const tronWeb = getTronWeb(network);
  const ownerAddress = await getOwnerAddress();

  try {
    // TronWeb expects [{key, value}] format, not a plain object
    const proposalParams = Object.entries(parameters).map(([k, v]) => ({
      key: Number(k),
      value: v,
    }));
    const transaction = await tronWeb.transactionBuilder.createProposal(
      proposalParams as any,
      ownerAddress as any,
    );
    return await buildSignBroadcast(transaction as any, network);
  } catch (error: any) {
    throw new Error(`Failed to create proposal: ${error.message}`);
  }
}

/**
 * Vote to approve a proposal (SR only)
 * @param proposalId The ID of the proposal to approve
 * @param approve Whether to approve (true) or disapprove (false)
 * @param network Network name
 * @returns Transaction hash
 */
export async function approveProposal(
  proposalId: number,
  approve: boolean,
  network = "mainnet",
): Promise<string> {
  const tronWeb = getTronWeb(network);
  const ownerAddress = await getOwnerAddress();

  try {
    const transaction = await tronWeb.transactionBuilder.voteProposal(
      proposalId,
      approve,
      ownerAddress as any,
    );
    return await buildSignBroadcast(transaction as any, network);
  } catch (error: any) {
    throw new Error(`Failed to approve proposal: ${error.message}`);
  }
}

/**
 * Delete a proposal (SR only, proposer only)
 * @param proposalId The ID of the proposal to delete
 * @param network Network name
 * @returns Transaction hash
 */
export async function deleteProposal(
  proposalId: number,
  network = "mainnet",
): Promise<string> {
  const tronWeb = getTronWeb(network);
  const ownerAddress = await getOwnerAddress();

  try {
    const transaction = await tronWeb.transactionBuilder.deleteProposal(
      proposalId,
      ownerAddress as any,
    );
    return await buildSignBroadcast(transaction as any, network);
  } catch (error: any) {
    throw new Error(`Failed to delete proposal: ${error.message}`);
  }
}
