import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerWalletTools(registerTool: RegisterToolFn) {
  registerTool(
    "get_wallet_address",
    {
      description:
        "Get the address of the configured wallet. Use this to verify which wallet is active.",
      inputSchema: {},
      annotations: {
        title: "Get Wallet Address",
        readOnlyHint: true,
        requiresWallet: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const address = await services.getOwnerAddress();
        const walletId = services.getActiveWalletId();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  walletId: walletId ?? undefined,
                  address,
                  base58: services.toBase58Address(address),
                  hex: services.toHexAddress(address),
                  message: "This is the wallet that will be used for all transactions",
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "list_wallets",
    {
      description:
        "List all available wallets. Returns wallet IDs, types, and addresses. Use select_wallet to switch between them.",
      inputSchema: {},
      annotations: {
        title: "List Wallets",
        readOnlyHint: true,
        requiresWallet: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const wallets = await services.listAgentWallets();
        const activeId = services.getActiveWalletId();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  activeWalletId: activeId,
                  wallets,
                  message:
                    wallets.length === 1 && wallets[0].id === "default"
                      ? "Running in legacy mode with a single wallet from environment variables."
                      : `Found ${wallets.length} wallet(s). Use select_wallet to switch the active wallet.`,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing wallets: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "select_wallet",
    {
      description:
        "Switch the active wallet at runtime. Use list_wallets to see available wallet IDs. Only available in agent-wallet mode.",
      inputSchema: {
        walletId: z.string().describe("The wallet ID to switch to"),
      },
      annotations: {
        title: "Select Wallet",
        readOnlyHint: false,
        requiresWallet: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ walletId }) => {
      try {
        const result = await services.selectWallet(walletId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: result.id,
                  address: result.address,
                  message: `Wallet switched to "${result.id}". All subsequent transactions will use this wallet.`,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error selecting wallet: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  registerTool(
    "sign_message",
    {
      description: "Sign an arbitrary message using the configured wallet.",
      inputSchema: {
        message: z.string().describe("The message to sign"),
      },
      annotations: {
        title: "Sign Message",
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ message }) => {
      try {
        const senderAddress = await services.getOwnerAddress();
        const signature = await services.signMessage(message);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  message,
                  signature,
                  signer: senderAddress,
                  messageType: "personal_sign",
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error signing message: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
