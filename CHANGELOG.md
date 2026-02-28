# Changelog

All notable changes to this project will be documented in this file.

## [1.1.3] - 2026-02-28

### Added

- Support for `--readonly` or `-r` command-line argument to disable write operations.
- Dynamic tool registration: "Write" tools are now hidden if no wallet is configured or if in readonly mode.
- Integrated `requiresWallet` and `isReadOnly` metadata for tools and prompts for better security control.
- Updated `AGENTS.md` with detailed contribution guidelines for agentic workflows.

### Changed

- Refined tool filtering logic: Read-only wallet tools (like `get_wallet_address`) remain visible in readonly mode if a key is present.
- Uniformed tool and prompt registration using local helper functions.

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
