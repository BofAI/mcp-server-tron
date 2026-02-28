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
- **Wallet Integration**: Support for Private Key and Mnemonic (BIP-39) wallets.
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

### Wallet & Security

- **Flexible Wallet**: Configure via `TRON_PRIVATE_KEY` or `TRON_MNEMONIC`.
- **HD Wallet**: Supports BIP-44 derivation path `m/44'/195'/0'/0/{index}`.
- **Signing**: Sign arbitrary messages.

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
git clone https://github.com/bankofai/mcp-server-tron.git
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

#### Wallet Configuration (Use Environment Variables)

**Option 1: Private Key**

```bash
# Recommended: Add this to your ~/.zshrc or ~/.bashrc
export TRON_PRIVATE_KEY="<YOUR_PRIVATE_KEY_HERE>"
```

**Option 2: Mnemonic Phrase**

```bash
# Recommended: Add this to your ~/.zshrc or ~/.bashrc
export TRON_MNEMONIC="<WORD1> <WORD2> ... <WORD12>"
export TRON_ACCOUNT_INDEX="0" # Optional, default: 0
```

### Server Configuration

The server runs on port **3001** by default in HTTP mode.

## Usage

### Running Locally

```bash
# Start in stdio mode (for MCP clients like Claude Desktop/Cursor)
npm start

# Start in readonly mode (disables write tools)
npm start -- --readonly

# Start in HTTP mode (Server-Sent Events)
npm run start:http
```

### Testing

The project includes a comprehensive test suite with unit tests and integration tests (using the Nile network).

```bash
# Run all tests
npm test

# Run specific test suites
npx vitest tests/core/tools.test.ts          # Unit tests for tools
npx vitest tests/core/services/multicall.test.ts # Multicall integration
npx vitest tests/core/services/services.test.ts # Services integration
```

### Client Configuration

To use this server with MCP clients like Claude Desktop, Cursor, or Google Antigravity, you need to add it to your configuration file.

#### 1. Locate your Configuration File

| Application            | OS      | Config Path                                                       |
| :--------------------- | :------ | :---------------------------------------------------------------- |
| **Claude Desktop**     | macOS   | `~/Library/Application Support/Claude/claude_desktop_config.json` |
|                        | Windows | `%APPDATA%\Claude\claude_desktop_config.json`                     |
| **Cursor**             | All     | Project root: `.cursor/mcp.json`                                  |
| **Google Antigravity** | All     | `~/.config/antigravity/mcp.json`                                  |
| **Opencode**           | All     | `~/.config/opencode/mcp.json`                                     |

#### 2. Add Server Definition

Choose one of the following methods to add to your `mcpServers` object.

**Option A: Quick Start (Recommended)**
Runs the latest version directly from npm.

```json
{
  "mcpServers": {
    "mcp-server-tron": {
      "command": "npx",
      "args": ["-y", "@bankofai/mcp-server-tron"],
      "env": {
        "TRON_PRIVATE_KEY": "YOUR_KEY_HERE (Or set in system env)",
        "TRONGRID_API_KEY": "YOUR_KEY_HERE (Or set in system env)"
      }
    }
  }
}
```

**Option B: Local Development**
For developers running from the cloned repository.

```json
{
  "mcpServers": {
    "mcp-server-tron": {
      "command": "npx",
      "args": ["tsx", "/ABSOLUTE/PATH/TO/mcp-server-tron/src/index.ts"],
      "env": {
        "TRON_PRIVATE_KEY": "YOUR_KEY_HERE (Or set in system env)",
        "TRONGRID_API_KEY": "YOUR_KEY_HERE (Or set in system env)"
      }
    }
  }
}
```

**Important**: We recommend omitting the `env` section if you have already set these variables in your system environment. If your MCP client doesn't inherit system variables, use placeholders or ensure the config file is not shared or committed to version control.

## API Reference

### Tools

#### Wallet & Address

| Tool Name            | Description                                         | Key Parameters |
| :------------------- | :-------------------------------------------------- | :------------- |
| `get_wallet_address` | Get the configured wallet's address (Base58 & Hex). | -              |
| `convert_address`    | Convert between Hex and Base58 formats.             | `address`      |

#### Network & Resources

| Tool Name                | Description                             | Key Parameters |
| :----------------------- | :-------------------------------------- | :------------- |
| `get_chain_info`         | Get current block and chain ID.         | `network`      |
| `get_chain_parameters`   | Get current Energy and Bandwidth costs. | `network`      |
| `get_supported_networks` | List available networks.                | -              |

#### Blocks & Transactions

| Tool Name              | Description                                | Key Parameters               |
| :--------------------- | :----------------------------------------- | :--------------------------- |
| `get_block`            | Fetch block by number or hash.             | `blockIdentifier`, `network` |
| `get_latest_block`     | Get the latest block.                      | `network`                    |
| `get_transaction`      | Get transaction details by hash.           | `txHash`, `network`          |
| `get_transaction_info` | Get receipt/info including resource usage. | `txHash`, `network`          |

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

| Tool Name        | Description                                | Key Parameters                                                |
| :--------------- | :----------------------------------------- | :------------------------------------------------------------ |
| `read_contract`  | Call read-only (`view`/`pure`) functions.  | `contractAddress`, `functionName`, `args`, `network`          |
| `multicall`      | Execute multiple read calls in one batch.  | `calls`, `network`                                            |
| `write_contract` | Execute state-changing contract functions. | `contractAddress`, `functionName`, `args`, `value`, `network` |

#### Signing & Security

| Tool Name      | Description                                | Key Parameters |
| :------------- | :----------------------------------------- | :------------- |
| `sign_message` | Sign a message with the configured wallet. | `message`      |

### Prompts

- `prepare_transfer`: Interactive guide to prepare TRX/TRC20 transfers.
- `diagnose_transaction`: Analyze a transaction hash for status and errors.
- `analyze_wallet`: Comprehensive report of wallet assets.
- `check_network_status`: Report on network health and resource costs.

## Security Considerations

- **Private Keys & Mnemonics**: **NEVER** save your sensitive wallet information in plain text configuration files (like `mcp.json`). These files are often unencrypted and can be accidentally shared or committed to git. Use system environment variables which are more secure.
- **Exposure**: If you are using a shared machine, be aware that environment variables might be visible to other users.
- **Testnets**: Always test on Nile or Shasta before performing operations on Mainnet.
- **Approvals**: Be cautious when approving token allowances via `write_contract`. Only approve what is necessary.

## Project Structure

```
mcp-server-tron/
├── src/
│   ├── core/
│   │   ├── chains.ts           # Network definitions
│   │   ├── tools.ts            # MCP Tool definitions
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
