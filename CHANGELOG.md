# Changelog

All notable changes to this project will be documented in this file.

## [1.1.3] - 2026-03-05

### Added

- **Agent-wallet integration**: Encrypted key storage via `@bankofai/agent-wallet` SDK. Private keys never exposed in environment variables.
- Dual-mode wallet support: agent-wallet mode (recommended) and legacy mode (`TRON_PRIVATE_KEY` / `TRON_MNEMONIC`).
- **69 new MCP tools** (26 → 95 total): account management, TronGrid data queries, Stake 2.0 resource delegation, contract management (ABI/settings/energy limit), governance & proposals (SR/witness/voting), block & transaction queries, broadcast, event logs, node info, and mempool.
- Support for `--readonly` or `-r` command-line argument to disable write operations.
- Dynamic tool registration: write tools hidden when no wallet is configured or in readonly mode.
- Refactored monolithic `tools.ts` into modular `src/core/tools/` directory (19 category files).
- Comprehensive test suite: 310 tests (277 active + 33 conditional).

### Changed

- Wallet dependency upgraded from `agent-wallet` (local) to `@bankofai/agent-wallet@^2.0.0-beta.0` (npm).
- Write tests now run with agent-wallet configuration, not just `TRON_PRIVATE_KEY`.
- MCP protocol version updated to `2025-11-25`.
- Refined tool filtering logic: Read-only wallet tools (like `get_wallet_address`) remain visible in readonly mode if a key is present.

### Removed

- Removed dead code: `src/core/tools.ts` (2160 lines, replaced by modular `src/core/tools/` directory).
- Removed deprecated wallet functions: `getConfiguredPrivateKey`, `getWalletAddressFromKey`, `getConfiguredWallet`.

### Security

- Agent-wallet mode encrypts private keys at rest — keys never appear in env vars or config files.
- Legacy plaintext private key mode retained for backward compatibility but discouraged.

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
