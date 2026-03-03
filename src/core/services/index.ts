// Export all services
export * from "./clients.js";
export * from "./balance.js";
export * from "./transfer.js";
export * from "./blocks.js";
export * from "./transactions.js";
export * from "./contracts.js";
export * from "./tokens.js";
export * from "./address.js";
export * from "./wallet.js";
export * from "./multicall-abi.js";
export * from "./staking.js";
export * from "./accountResource.js";
export * from "./query.js";
export * from "./broadcast.js";
export * from "./nodes.js";
export * from "./mempool.js";
export * from "./events.js";
export * from "./account.js";
export * from "./governance.js";
export * from "./proposals.js";
export * from "./trongrid-client.js";
export * from "./account-data.js";
export * from "./contract-data.js";
export * from "./utils.js"; // Export utils as top level as well

// Add a helper object for easier access to everything
import * as clients from "./clients.js";
import * as wallet from "./wallet.js";
import * as balance from "./balance.js";
import * as blocks from "./blocks.js";
import * as transactions from "./transactions.js";
import * as contracts from "./contracts.js";
import * as tokens from "./tokens.js";
import * as transfer from "./transfer.js";
import * as utils from "./utils.js";
import * as address from "./address.js";
import * as staking from "./staking.js";
import * as accountResource from "./accountResource.js";
import * as query from "./query.js";
import * as broadcast from "./broadcast.js";
import * as nodes from "./nodes.js";
import * as mempool from "./mempool.js";
import * as events from "./events.js";
import * as account from "./account.js";
import * as governance from "./governance.js";
import * as proposals from "./proposals.js";
import * as trongridClient from "./trongrid-client.js";
import * as accountData from "./account-data.js";
import * as contractData from "./contract-data.js";

// Re-export specific utils function as 'helpers' for backward compatibility with tools code
export const helpers: Record<string, unknown> & { formatJson: (data: unknown) => string } = {
  ...clients,
  ...wallet,
  ...balance,
  ...blocks,
  ...transactions,
  ...contracts,
  ...tokens,
  ...transfer,
  ...address,
  ...staking,
  ...accountResource,
  ...query,
  ...broadcast,
  ...nodes,
  ...mempool,
  ...events,
  ...account,
  ...governance,
  ...proposals,
  ...trongridClient,
  ...accountData,
  ...contractData,
  ...utils,
  // Specifically map formatJson from utils to helpers root as tools expect it there
  formatJson: utils.utils.formatJson,
};
