# Agent Guidelines: MCP Server Tron

This document provides essential information for AI agents working on this repository.

## 🛠 Commands

### Development & Build

- **Build**: `npm run build` (runs `tsc`)
- **Lint**: `npm run lint` (runs `eslint`)
- **Fix Lint**: `npm run lint:fix`
- **Clean**: `rm -rf build`

### Testing

- **Run all tests**: `npm test` (runs `vitest run`)
- **Run specific test file**: `npx vitest tests/core/services/utils.test.ts`
- **Run with UI**: `npx vitest --ui`
- **Watch mode**: `npx vitest`

### Execution

- **Start (Stdio)**: `npm start` (uses `tsx` to run `src/index.ts`)
- **Start (HTTP)**: `npm run start:http`
- **Read-only mode**: Add `--readonly` or `-r` to disable write tools (e.g., `npm start -- --readonly`)
- **Inspect**: `npm run inspect` (launches MCP Inspector)

---

## 🎨 Code Style & Conventions

### 📦 Imports

- Use **ES Modules** (`import/export`).
- When importing from local files, follow `NodeNext` resolution: use `.js` extension in the import path (e.g., `import { foo } from "./foo.js"`).
- Organize imports: built-ins first, then external libraries, then internal modules.

### 🏷 Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `http-server.ts`).
- **Tests**: `name.test.ts` or `name_integration.ts`.
- **Variables/Functions**: `camelCase`.
- **Classes/Interfaces**: `PascalCase`.
- **MCP Tools**: `snake_case` (e.g., `get_wallet_address`).
- **Constants**: `UPPER_SNAKE_CASE`.

### 🏗 Architecture

- **src/core/services**: Contains the business logic and TronWeb integrations.
- **src/core/tools/**: MCP tool definitions split by category (wallet, network, address, block, balance, transaction, contract, transfer, staking, account), with schema validation using `zod`.
- **src/core/prompts.ts**: MCP prompt definitions.
- **src/server**: Protocol-specific server implementations (Stdio/HTTP).

### 🚦 Error Handling

- **Services**: Throw descriptive `Error` objects.
- **Tools**: Use `try-catch` blocks. Return `isError: true` and a structured error message in the `content` array if an operation fails.
- Avoid `process.exit()` in library code; let the server handle fatal errors.

### 🧪 Testing Guidelines

- Use **Vitest** for all tests.
- Place unit tests in `tests/core/`.
- Integration tests (requiring network access) should use the Nile testnet where possible.
- Use `vi.mock()` for external API calls in unit tests to ensure reliability and speed.

### 💎 TypeScript Usage

- **Strict Mode**: Enabled. Always aim for type safety.
- **Zod**: Use `zod` for all input validation in MCP tools.
- **BigInt**: Handle blockchain numbers (Sun) using `bigint` or strings to avoid precision issues. Use `utils.formatJson` for JSON serialization.
- **Explicit Types**: Preferred for public APIs and complex logic.

---

## 🔐 Environment & Security

- **Sensitive Data**: NEVER hardcode private keys or mnemonics.
- **Required Env Vars**:
  - `TRON_PRIVATE_KEY`: Hex key for write operations.
  - `TRON_MNEMONIC`: 12/24 word phrase (alternative to key).
  - `TRONGRID_API_KEY`: Optional but recommended for Mainnet.

## 🤖 MCP Specifics

- **Tools**: Every tool must have a clear `description` and `inputSchema`.
- **Conditional Registration**: Tools are conditionally registered based on whether a wallet is configured.
  - "Write" tools (state-changing) are automatically identified by `readOnlyHint: false`.
  - Special "Read" tools that depend on wallet configuration (e.g., `get_wallet_address`) must specify `requiresWallet: true` in their annotations.
- **Annotations**: Use `annotations` (`title`, `readOnlyHint`, `requiresWallet`, etc.) to help LLMs understand tool impact and to control registration logic.
- **Serialization**: Use the `utils.formatJson` helper to handle `BigInt` when returning tool results.

---

## 🛠 Common Workflows

### Adding a New Tool

1.  **Define Logic**: Add a new service in `src/core/services/` if it involves complex blockchain interaction.
2.  **Register Tool**: Add to the appropriate category file in `src/core/tools/` (or create a new one) using the `registerTool` helper.
3.  **Schema**: Define the input schema using `zod`.
4.  **Error Handling**: Wrap the implementation in a `try-catch` block.
5.  **Documentation**: Add a clear description and title in `annotations`.
6.  **Test**: Add a unit test in `tests/core/tools.test.ts` and an integration test if necessary.

### Handling Network Selection

The server supports multiple networks (`mainnet`, `nile`, `shasta`).

- Always use the `network` parameter from tool inputs.
- Default to `mainnet` if not provided.
- Use `getTronWeb(network)` from `src/core/services/clients.ts` to get a pre-configured `TronWeb` instance.

### Working with Smart Contracts

- Use `readContract` for view/pure functions.
- Use `writeContract` for state-changing functions.
- The server automatically attempts to fetch ABIs for verified contracts on TRONSCAN.
- For `multicall`, providing the ABI is required as it uses a batching contract.

---

## 📝 Additional Notes

- Follow the existing pattern for registering tools in `src/core/tools/`.
- When adding new network support, update `src/core/chains.ts`.
- Keep documentation in `README.md` and `AGENTS.md` up to date with new features.
