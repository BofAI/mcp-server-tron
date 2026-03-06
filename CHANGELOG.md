# Changelog

All notable changes to this project will be documented in this file.

## [1.1.3] - 2026-02-28

### Added

- Governance & Super Representative tools: witness management, voting, rewards, and brokerage.
- Proposal tools: create, approve, delete, and query network governance proposals.
- Full account management: account info, resource queries, delegation, permissions, and on-chain activation.
- Account & contract data queries via TronGrid: transaction history, TRC20 transfers, internal transactions, token balances, and holder lists.
- Extended contract tools: deploy contracts, estimate energy, fetch ABI, and manage contract settings.
- Staking (Stake 2.0): freeze/unfreeze TRX, withdraw expired balances, and cancel pending unfreezes.
- Resource delegation: delegate/undelegate Energy and Bandwidth between accounts.
- Transaction broadcast and building: create unsigned transactions, broadcast signed JSON or hex.
- Event queries: query contract events by transaction, contract address, or block number.
- Mempool tools: view pending transactions and pool size.
- Node tools: list connected nodes and query node info.
- Extended block and transaction query tools via full-node HTTP API.
- Network query tools: historical energy/bandwidth prices and TRX burn stats.
- Support for `--readonly` or `-r` command-line argument to disable write operations.
- Dynamic tool registration: write tools are hidden if no wallet is configured or if in readonly mode.
- Added `.env.example`, `start.sh`, and `vitest.config.ts`.
- Comprehensive test coverage for all new services and tools.

### Changed

- Refactored tools and services into modular directory structures split by category.
- Refined tool filtering logic with `requiresWallet` and `isReadOnly` metadata.
- Updated README with full API reference, remote server configuration, and improved testing docs.

## [1.1.2] - 2026-02-08

### Changed

- Support array parameters in contract calls.
- Support passing ABI in contract calls.

## [1.1.1] - 2026-01-27

### Changed

- Added `mcpName` to `package.json` for MCP Registry verification.

## [1.1.0] - 2026-01-27

### Added

- Initial implementation of TRON MCP Server.
- Support for TRX and TRC20 token transfers.
- Smart contract interaction (read/write/multicall).
- Support for `TRONGRID_API_KEY` to handle rate limits.
- BIP-39 mnemonic and HD wallet support.
- Address conversion between Hex and Base58 formats.
- Resource cost queries (Energy/Bandwidth).
- Secure npm publishing via OIDC (OpenID Connect) with provenance.
- Release workflow triggered by GitHub Release events.

### Security

- **Environment Variable Safety**: Documentation emphasizing the use of environment variables for private keys instead of MCP configuration files.
