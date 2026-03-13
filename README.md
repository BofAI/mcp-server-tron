# MCP Server Tron

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![TRON Network](https://img.shields.io/badge/Network-TRON-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6)
![MCP](https://img.shields.io/badge/MCP-1.22.0+-blue)
![TronWeb](https://img.shields.io/badge/TronWeb-6.0+-green)

A comprehensive Model Context Protocol (MCP) server that provides blockchain services for the TRON network. This server enables AI agents to interact with TRON blockchain with a unified interface through tools and AI-guided prompts for TRX, TRC20 tokens and smart contracts.

## Contents

- [Overview](#overview)
- [Features](#features)
- [Supported Networks](#supported-networks)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Server Configuration](#server-configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
  - [Tools](#tools)
  - [Prompts](#prompts)
- [Security Considerations](#security-considerations)
- [Project Structure](#project-structure)
- [License](#license)

## Overview

The MCP TRON Server leverages the Model Context Protocol to provide blockchain services to AI agents. It fully supports the TRON ecosystem using `tronweb`.

Key capabilities:

- **Blockchain Data**: Read blocks, transactions, and chain parameters (Energy/Bandwidth costs).
- **Smart Contracts**: Interact with any TRON smart contract (Read/Write).
- **Tokens**: Transfer TRX and TRC20 tokens; check balances.
- **Address Management**: Convert between Hex (0x...) and Base58 (T...) formats.
- **Wallet Integration**: Agent-wallet (encrypted keystore), Private Key, and Mnemonic (BIP-39) wallets.
- **Multi-Network**: Seamless support for Mainnet, Nile, and Shasta.
- **Dynamic Access Control**: Automatically hides write tools if no wallet is configured or if `--readonly` mode is active.

## Features

### Blockchain Data Access

- **TRON network support**: Mainnet, Nile, Shasta.
- **Chain information**: Block number, Chain ID, RPC endpoints.
- **Block data**: Access by number or hash.
- **Transaction details**: Detailed info including resource usage (Energy/Bandwidth).
- **Resource Costs**: Query current chain parameters for Energy and Bandwidth prices.

### Token Services

- **Native TRX**: Check balance and transfer.
- **TRC20 Tokens**:
  - Check balances.
  - Transfer tokens.
  - Get token metadata (name, symbol, decimals).

### Address Services

- **Format Conversion**: Convert between Hex (`41...` or `0x...`) and Base58 (`T...`) formats.
- **Validation**: Verify if an address is valid on TRON.

### Smart Contract Interactions

- **Read Contract**: Call `view` and `pure` functions.
- **Write Contract**: Execute state-changing functions.
- **ABI Fetching**: Automatically fetches ABI from the blockchain for verified contracts.

### Governance & Proposals

- **Super Representatives**: List, vote, create/update witnesses, manage brokerage.
- **Proposals**: List, view, create, approve, and delete governance proposals.
- **Rewards**: Query and withdraw SR voting rewards.

### Events & Data Queries

- **Contract Events**: Query events by transaction, contract address, or block number.
- **Account Data**: Transaction history, TRC20 transfers, internal transactions, token balances (via TronGrid).
- **Contract Data**: Contract transaction history, internal transactions, token holder lists.
- **Mempool**: View pending transactions and pool size.
- **Node Info**: List connected nodes and query node details.

### Staking & Resource Delegation (Stake 2.0)

- **Staking**: Freeze/unfreeze TRX for Energy or Bandwidth.
- **Delegation**: Delegate and undelegate resources to other accounts.
- **Queries**: Available unfreeze count, withdrawable amounts, delegation details.

### Wallet & Security

- **Agent Wallet (Recommended)**: Encrypted key storage via agent-wallet SDK — private keys never leave the keystore.
- **Static Wallet**: Configure via `TRON_PRIVATE_KEY` or `TRON_MNEMONIC` environment variables.
- **HD Wallet**: Supports BIP-44 derivation path `m/44'/195'/0'/0/{index}`.
- **Signing**: Sign arbitrary messages and transactions.

## Supported Networks

- **Mainnet**: `mainnet` (Default)
- **Nile Testnet**: `nile`
- **Shasta Testnet**: `shasta`

## Prerequisites

- [Node.js](https://nodejs.org/) 20.0.0 or higher
- Optional: [TronGrid API key](https://www.trongrid.io/) to avoid rate limiting on Mainnet.

## Installation

```bash
# Clone the repository
git clone https://github.com/BofAI/mcp-server-tron.git
cd mcp-server-tron

# Install dependencies
npm install
```

## Configuration

### Environment Variables

**CRITICAL SECURITY NOTE**: For your security, **NEVER** save your private keys or mnemonics directly in the MCP configuration JSON files (like `claude_desktop_config.json` or `mcp.json`). Instead, set them as environment variables in your operating system or shell configuration.

To enable write operations (transfers, contract calls) and ensure reliable API access, you should configure the following variables.

#### Network Configuration

- `TRONGRID_API_KEY`: (Optional) Your TronGrid API key.
  - **Why**: TRON mainnet RPCs have strict rate limits. Using an API key from [TronGrid](https://www.trongrid.io/) ensures reliable performance and higher throughput.
  - **Usage**:
    ```bash
    export TRONGRID_API_KEY="<YOUR_TRONGRID_API_KEY_HERE>"
    ```

#### Wallet Configuration

Choose **one** of the following modes. If none is configured, the server runs in **read-only mode**.

**Option 1: Agent-Wallet Mode (Recommended)**

Private keys are encrypted at rest and never exposed in environment variables.

> **Prerequisites**: Install and configure [agent-wallet](https://github.com/BofAI/agent-wallet/blob/main/doc/getting-started.md)

```bash
export AGENT_WALLET_PASSWORD="<YOUR_MASTER_PASSWORD>"
export AGENT_WALLET_DIR="<YOUR_WALLET_DIR>"  # Optional, default: ~/.agent-wallet
```

> `AGENT_WALLET_PASSWORD` must match the master password used during `agent-wallet`. If not set, agent-wallet mode is disabled and the server falls back to static mode or read-only mode.

**Option 2: Private Key**

```bash
export TRON_PRIVATE_KEY="<YOUR_PRIVATE_KEY_HERE>"
```

**Option 3: Mnemonic Phrase**

```bash
export TRON_MNEMONIC="<WORD1> <WORD2> ... <WORD12>"
export TRON_ACCOUNT_INDEX="0"  # Optional, default: 0
```

> **Security Note**: Static modes expose keys in plaintext. **Only keep small amounts of funds** in these wallets — large balances carry a real **risk of theft**. Use Agent-Wallet Mode (Option 1) for any significant funds.

> See [`.env.example`](.env.example) for a complete list of all supported environment variables.

### Server Configuration

The server runs on port **3001** by default in HTTP mode.

## Usage

### Running Locally

```bash
# Start in stdio mode (for MCP clients like Claude Desktop/Cursor)
npm start

# Start in readonly mode (disables write tools)
npm start -- --readonly

# Start in HTTP mode (Streamable HTTP)
npm run start:http
```

### Testing

The project includes a comprehensive test suite with unit tests and integration tests (using the Nile testnet).

```bash
# Run all tests
npm test

# Unit tests (mocked services, no network)
npx vitest tests/core/tools.test.ts                    # All MCP tools registration & handlers
npx vitest tests/core/services/contracts.test.ts       # Contract services
npx vitest tests/core/services/account-resource.test.ts # Account resource services
npx vitest tests/core/services/staking.test.ts         # Staking services

# Integration tests (real Nile RPC; write tests require AGENT_WALLET_PASSWORD or TRON_PRIVATE_KEY)
npx vitest tests/core/tools_integration.test.ts        # Full tool flow on Nile
npx vitest tests/core/services/multicall.test.ts       # Multicall integration
npx vitest tests/core/services/services.test.ts        # Services integration
```

- **Unit tests** use mocks and do not need network or wallet.
- **Integration tests** (`tools_integration.test.ts`) call Nile RPC; most cases are read-only. Tests that broadcast transactions (e.g. `vote_witness`, `withdraw_balance`) run only when a wallet is configured (`AGENT_WALLET_PASSWORD` or `TRON_PRIVATE_KEY`) and are skipped otherwise.

### Client Configuration

#### Option A: Quick Start (Recommended)

Runs the latest version directly from npm via stdio transport.

**Claude Code:**

```bash
claude mcp add mcp-server-tron -- npx -y @bankofai/mcp-server-tron
```

With environment variables:

```bash
claude mcp add -e AGENT_WALLET_PASSWORD=xxx -e TRONGRID_API_KEY=xxx mcp-server-tron -- npx -y @bankofai/mcp-server-tron
```

**Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "mcp-server-tron": {
      "command": "npx",
      "args": ["-y", "@bankofai/mcp-server-tron"],
      "env": {
        "AGENT_WALLET_PASSWORD": "YOUR_PASSWORD (Or set in system env)",
        "TRONGRID_API_KEY": "YOUR_KEY_HERE (Or set in system env)"
      }
    }
  }
}
```

#### Option B: Official Hosted Server (Remote)

Connect to the official hosted server at `https://tron-mcp-server.bankofai.io`. No installation required, readonly mode.

**Claude Code:**

```bash
claude mcp add -transport http mcp-server-tron https://tron-mcp-server.bankofai.io/mcp
```

**Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "mcp-server-tron": {
      "url": "https://tron-mcp-server.bankofai.io/mcp"
    }
  }
}
```

## API Reference

### Tools

#### Wallet & Address

| Tool Name            | Description                                         | Key Parameters |
| :------------------- | :-------------------------------------------------- | :------------- |
| `get_wallet_address` | Get the configured wallet's address (Base58 & Hex). | -              |
| `list_wallets`       | List all available wallets with IDs and addresses.   | -              |
| `select_wallet`      | Switch the active wallet at runtime (agent-wallet mode). | `walletId` |
| `convert_address`    | Convert between Hex and Base58 formats.             | `address`      |

#### Network & Resources

| Tool Name                | Description                             | Key Parameters |
| :----------------------- | :-------------------------------------- | :------------- |
| `get_chain_info`         | Get current block and chain ID.         | `network`      |
| `get_chain_parameters`   | Get current Energy and Bandwidth costs. | `network`      |
| `get_energy_prices`      | Query historical energy unit price.     | `network`      |
| `get_bandwidth_prices`   | Query historical bandwidth unit price.  | `network`      |
| `get_burn_trx`           | Query total TRX burned from fees.       | `network`      |
| `get_supported_networks` | List available networks.                | -              |

#### Blocks & Transactions

| Tool Name              | Description                                | Key Parameters               |
| :--------------------- | :----------------------------------------- | :--------------------------- |
| `get_block`            | Fetch block by number or hash.             | `blockIdentifier`, `network` |
| `get_latest_block`     | Get the latest block.                      | `network`                    |
| `get_transaction`      | Get transaction details by hash.           | `txHash`, `network`          |
| `get_transaction_info` | Get receipt/info including resource usage. | `txHash`, `network`          |
| `get_block_by_num`     | Query block by block height.               | `num`, `network`             |
| `get_block_by_id`      | Query block by block ID (hash).            | `value`, `network`           |
| `get_block_by_latest_num` | Get latest N blocks (solidified).       | `num`, `network`             |
| `get_block_by_limit_next`  | Get blocks in range [startNum, endNum). | `startNum`, `endNum`, `network` |
| `get_now_block`        | Get the current latest block info.         | `network`                    |
| `get_transaction_by_id` | Query transaction status/content by txID. | `value`, `network`           |
| `get_transaction_info_by_id` | Query transaction receipt by txID.   | `value`, `network`           |
| `get_transaction_info_by_block_num` | Get receipts for all txs in a block. | `num`, `network`     |
| `get_approved_list`    | Query the list of accounts that signed a transaction. | `transaction`, `network` |
| `get_block_balance`    | Get all balance change operations in a block. | `hash`, `number`, `network` |

#### Broadcast & Transaction Building (Write)

| Tool Name               | Description                                                        | Key Parameters                      |
| :---------------------- | :----------------------------------------------------------------- | :---------------------------------- |
| `create_transaction`    | Create an unsigned TRX transfer transaction.                       | `ownerAddress`, `toAddress`, `amount`, `network` |
| `broadcast_transaction` | Broadcast a signed transaction JSON object to the TRON network.     | `transaction`, `network`           |
| `broadcast_hex`         | Broadcast a signed protobuf-encoded transaction hex string.         | `transaction`, `network`           |

#### Balances

| Tool Name           | Description                             | Key Parameters                       |
| :------------------ | :-------------------------------------- | :----------------------------------- |
| `get_balance`       | Get TRX balance for an address.         | `address`, `network`                 |
| `get_token_balance` | Get TRC20 token balance for an address. | `address`, `tokenAddress`, `network` |

#### Transfers (Write)

| Tool Name        | Description                      | Key Parameters                            |
| :--------------- | :------------------------------- | :---------------------------------------- |
| `transfer_trx`   | Send TRX (Native) to an address. | `to`, `amount`, `network`                 |
| `transfer_trc20` | Send TRC20 tokens to an address. | `tokenAddress`, `to`, `amount`, `network` |

#### Smart Contracts

| Tool Name            | Description                                               | Key Parameters                                                |
| :------------------- | :-------------------------------------------------------- | :------------------------------------------------------------ |
| `read_contract`     | Call read-only (`view`/`pure`) functions.                  | `contractAddress`, `functionName`, `args`, `network`          |
| `get_contract`      | Get raw contract metadata (ABI, bytecode) from chain.    | `contractAddress`, `network`                                 |
| `get_contract_info` | Get ABI, function list and raw metadata.                  | `contractAddress`, `network`                                  |
| `fetch_contract_abi`| Fetch ABI entry array for verified contracts.             | `contractAddress`, `network`                                  |
| `multicall`         | Execute multiple read calls in one batch.                 | `calls`, `network`                                            |
| `write_contract`    | Execute state-changing contract functions.                | `contractAddress`, `functionName`, `args`, `value`, `network` |
| `deploy_contract`   | Deploy a smart contract with ABI and bytecode.           | `abi`, `bytecode`, `args`, `network`                          |
| `estimate_energy`   | Estimate energy consumption for a contract call.         | `address`, `functionName`, `abi`, `network`                   |
| `update_contract_setting` | Update consume_user_resource_percent (creator only). | `contractAddress`, `consumeUserResourcePercent`, `network`     |
| `update_energy_limit`    | Update originEnergyLimit (creator only).             | `contractAddress`, `originEnergyLimit`, `network`              |
| `clear_abi`         | Clear on-chain ABI metadata (creator only).               | `contractAddress`, `network`                                  |

#### Account Management

| Tool Name                       | Description                                                     | Key Parameters                                         |
| :------------------------------ | :-------------------------------------------------------------- | :----------------------------------------------------- |
| `get_account`                   | Get full account info (balance, resources, permissions, etc.).   | `address`, `network`                                   |
| `get_account_balance`           | Get TRX balance at a specific block height.                     | `address`, `blockHash`, `blockNumber`, `network`       |
| `generate_account`              | Generate a new TRON keypair offline.                            | -                                                      |
| `validate_address`              | Validate a TRON address and detect format.                      | `address`                                              |
| `get_account_net`               | Get bandwidth information for an account.                       | `address`, `network`                                   |
| `get_account_resource`          | Get energy, bandwidth, and delegation details.                  | `address`, `network`                                   |
| `get_delegated_resource`        | Query delegated resources between two accounts (Stake 2.0).     | `fromAddress`, `toAddress`, `network`                  |
| `get_delegated_resource_index`  | Query delegation index (who delegated to/from this account).    | `address`, `network`                                   |
| `create_account`                | Activate a new account on-chain (costs bandwidth).              | `address`, `network`                                   |
| `update_account`                | Set account name (can only be set once).                        | `accountName`, `network`                               |
| `account_permission_update`     | Update multi-signature permissions.                             | `ownerPermission`, `activePermissions`, `network`      |

#### Staking (Stake 2.0)

| Tool Name                       | Description                                                       | Key Parameters                  |
| :------------------------------ | :---------------------------------------------------------------- | :----------------------------- |
| `freeze_balance_v2`             | Freeze TRX to get resources (BANDWIDTH/ENERGY).                   | `amount`, `resource`, `network` |
| `unfreeze_balance_v2`           | Unfreeze TRX to release resources.                               | `amount`, `resource`, `network` |
| `withdraw_expire_unfreeze`      | Withdraw expired unfrozen balance back to available.             | `network`                      |
| `cancel_all_unfreeze_v2`        | Re-stake pending unfreezes; withdraw expired ones.               | `network`                      |
| `get_available_unfreeze_count`  | Get remaining unstake operation quota (max 32).                  | `address`, `network`           |
| `get_can_withdraw_unfreeze_amount` | Get withdrawable TRX from unfreeze at a timestamp.            | `address`, `timestampMs`, `network` |

#### Account resource (Stake 2.0 delegation)

| Tool Name                                | Description                                                    | Key Parameters                                    |
| :--------------------------------------- | :------------------------------------------------------------- | :----------------------------------------------- |
| `delegate_resource`                      | Delegate BANDWIDTH/ENERGY to another address.                   | `receiverAddress`, `amount`, `resource`, `network` |
| `undelegate_resource`                   | Revoke delegated resources.                                   | `receiverAddress`, `amount`, `resource`, `network` |
| `get_can_delegated_max_size`             | Get max delegatable amount for an address.                     | `address`, `resource`, `network`                  |
| `get_delegated_resource_v2`              | Get delegation details between two addresses.                  | `fromAddress`, `toAddress`, `network`             |
| `get_delegated_resource_account_index_v2`| Get who delegated to/from an address.                          | `address`, `network`                             |

#### Governance (Super Representatives)

| Tool Name                  | Description                                                      | Key Parameters                  |
| :------------------------- | :--------------------------------------------------------------- | :------------------------------ |
| `list_witnesses`           | Get the full list of all Super Representatives on the network.   | `network`                       |
| `get_paginated_witnesses`  | Get a paginated list of current active Super Representatives.    | `offset`, `limit`, `network`    |
| `get_next_maintenance_time`| Get the next SR maintenance (vote tally) time.                   | `network`                       |
| `get_reward`               | Get unclaimed SR voting reward for an address.                   | `address`, `network`            |
| `get_brokerage`            | Get SR brokerage ratio (reward split with voters).               | `address`, `network`            |
| `create_witness`           | Apply to become a Super Representative candidate.                | `url`, `network`                |
| `update_witness`           | Update Super Representative URL.                                 | `url`, `network`                |
| `vote_witness`             | Vote for Super Representatives with frozen TRX.                  | `votes`, `network`              |
| `withdraw_balance`         | Withdraw accumulated SR block rewards.                           | `network`                       |
| `update_brokerage`         | Update SR brokerage ratio.                                       | `brokerage`, `network`          |

#### Proposals

| Tool Name          | Description                                 | Key Parameters                         |
| :----------------- | :------------------------------------------ | :------------------------------------- |
| `list_proposals`   | List all network governance proposals.      | `network`                              |
| `get_proposal`     | Get details of a specific proposal by ID.   | `proposalId`, `network`               |
| `create_proposal`  | Create a new governance proposal (SR only). | `parameters`, `network`               |
| `approve_proposal` | Approve or revoke a proposal (SR only).     | `proposalId`, `hasApproval`, `network` |
| `delete_proposal`  | Delete a proposal (creator only).           | `proposalId`, `network`               |

#### Events

| Tool Name                       | Description                                           | Key Parameters                           |
| :------------------------------ | :---------------------------------------------------- | :--------------------------------------- |
| `get_events_by_transaction_id`  | Get all events emitted by a specific transaction.     | `transactionId`, `onlyConfirmed`, `network` |
| `get_events_by_contract_address`| Get events emitted by a specific contract.            | `contractAddress`, `eventName`, `network` |
| `get_events_by_block_number`    | Get all events emitted in a specific block.           | `blockNumber`, `network`                 |
| `get_events_of_latest_block`    | Get all events from the latest block.                 | `network`                                |

#### Account Data (TronGrid)

| Tool Name                          | Description                                            | Key Parameters                         |
| :--------------------------------- | :----------------------------------------------------- | :------------------------------------- |
| `get_account_info`                 | Get account summary from TronGrid.                     | `address`, `network`                   |
| `get_account_transactions`         | Get transaction history for an account.                | `address`, `limit`, `network`          |
| `get_account_trc20_transactions`   | Get TRC20 transfer history for an account.             | `address`, `limit`, `network`          |
| `get_account_internal_transactions`| Get internal transaction history for an account.       | `address`, `limit`, `network`          |
| `get_account_trc20_balances`       | Get all TRC20 token balances for an account.           | `address`, `network`                   |

#### Contract Data (TronGrid)

| Tool Name                          | Description                                           | Key Parameters                         |
| :--------------------------------- | :---------------------------------------------------- | :------------------------------------- |
| `get_contract_transactions`        | Get transaction history for a contract.               | `contractAddress`, `limit`, `network`  |
| `get_contract_internal_transactions`| Get internal transactions for a contract.            | `contractAddress`, `limit`, `network`  |
| `get_trc20_token_holders`          | Get holder list for a TRC20 token.                    | `contractAddress`, `limit`, `network`  |

#### Mempool

| Tool Name                       | Description                                              | Key Parameters        |
| :------------------------------ | :------------------------------------------------------- | :-------------------- |
| `get_pending_transactions`      | Get transaction IDs in the pending pool (mempool).       | `network`             |
| `get_transaction_from_pending`  | Get a specific transaction from the pending pool.        | `txId`, `network`     |
| `get_pending_size`              | Get the current size of the pending transaction pool.    | `network`             |

#### Node

| Tool Name      | Description                                           | Key Parameters |
| :------------- | :---------------------------------------------------- | :------------- |
| `list_nodes`   | List all connected node addresses on the network.     | `network`      |
| `get_node_info`| Get detailed info about the connected full node.      | `network`      |

#### Signing & Security

| Tool Name      | Description                                | Key Parameters |
| :------------- | :----------------------------------------- | :------------- |
| `sign_message` | Sign a message with the configured wallet. | `message`      |

### Prompts

- `prepare_transfer`: Interactive guide to prepare TRX/TRC20 transfers.
- `interact_with_contract`: Step-by-step guide to interact with a smart contract.
- `diagnose_transaction`: Analyze a transaction hash for status and errors.
- `explain_tron_concept`: Explain a TRON blockchain concept with examples.
- `analyze_wallet`: Comprehensive report of wallet assets.
- `check_network_status`: Report on network health and resource costs.

## Security Considerations

- **Private Keys & Mnemonics**: **NEVER** save your sensitive wallet information in plain text configuration files (like `mcp.json`). These files are often unencrypted and can be accidentally shared or committed to git. Use system environment variables which are more secure.
- **Fund Safety (Static Mode)**: If you use `TRON_PRIVATE_KEY` or `TRON_MNEMONIC`, keys are stored in plaintext environment variables. This carries a **real risk of fund theft** — environment variables can be leaked via shell history, process listings, or log files. **Only keep a small amount of funds** in these wallets. For wallets holding any significant value, always use [Agent-Wallet Mode](#option-1-agent-wallet-mode-recommended).
- **Shared Machines**: Be aware that on shared systems, environment variables might be visible to other users via `/proc` or system monitoring tools.
- **Testnets**: Always test on Nile or Shasta before performing operations on Mainnet.
- **Approvals**: Be cautious when approving token allowances via `write_contract`. Only approve what is necessary.

## Project Structure

```
mcp-server-tron/
├── src/
│   ├── core/
│   │   ├── chains.ts           # Network definitions
│   │   ├── tools/              # MCP Tool definitions (split by category)
│   │   ├── prompts.ts          # MCP Prompt definitions
│   │   └── services/           # Business logic (TronWeb integration)
│   │       ├── wallet.ts       # Wallet management
│   │       ├── transfer.ts     # Transfer logic
│   │       ├── contracts.ts    # Contract logic
│   │       ├── address.ts      # Address conversion
│   │       └── ...
│   ├── server/                 # HTTP/Stdio server setup
│   └── index.ts                # Entry point
├── tests/                      # Unit tests
└── package.json
```

## License

MIT
