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
        const address = services.getWalletAddressFromKey();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
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
        const senderAddress = services.getWalletAddressFromKey();
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
