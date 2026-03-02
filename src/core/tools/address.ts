import { z } from "zod";
import * as services from "../services/index.js";
import type { RegisterToolFn } from "./types.js";

export function registerAddressTools(registerTool: RegisterToolFn) {
  registerTool(
    "convert_address",
    {
      description: "Convert addresses between Hex and Base58 formats",
      inputSchema: {
        address: z.string().describe("Address to convert (Hex or Base58)"),
      },
      annotations: {
        title: "Convert Address",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ address }) => {
      try {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  original: address,
                  base58: services.toBase58Address(address),
                  hex: services.toHexAddress(address),
                  isValid: services.utils.isAddress(address),
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
              text: `Error converting address: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
