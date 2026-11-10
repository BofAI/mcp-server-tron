import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import startServer from "../../src/server/server.js";

describe("MCP tool input limits", () => {
  it("accepts ordinary arguments and rejects oversized arrays and records before the handler", async () => {
    const server = await startServer({ readOnly: true });
    const handler = vi.fn(async () => ({ content: [{ type: "text" as const, text: "ok" }] }));
    server.registerTool(
      "input_limit_control",
      {
        inputSchema: { values: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]) },
      },
      handler,
    );
    const client = new Client({ name: "input-limit-test", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      const normal = await client.callTool({
        name: "input_limit_control",
        arguments: { values: [1] },
      });
      expect(normal.isError).not.toBe(true);
      expect(handler).toHaveBeenCalledTimes(1);
      const inputs = [
        Array(10_001).fill(0),
        Object.fromEntries(Array.from({ length: 10_001 }, (_, i) => [String(i), 0])),
      ];
      for (const values of inputs) {
        const result = await client.callTool({
          name: "input_limit_control",
          arguments: { values },
        });
        expect(result.isError).toBe(true);
      }
      expect(handler).toHaveBeenCalledTimes(1);
    } finally {
      await client.close();
      await server.close();
    }
  });
});
