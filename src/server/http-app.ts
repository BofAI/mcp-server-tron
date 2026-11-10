import express, { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import startServer, { MCP_PROTOCOL_VERSION, version } from "./server.js";

export type HttpAppContext = {
  app: express.Express;
  shutdown: () => Promise<void>;
  getActiveSessionCount: () => number;
};

export function createHttpApp(options: { readOnly?: boolean } = {}): HttpAppContext {
  const app = express();
  // Parse only bounded, uncompressed JSON before passing it to the MCP SDK.
  app.use(express.json({ limit: "1mb", inflate: false }));

  app.post("/mcp", async (req: Request, res: Response) => {
    console.log(`Received POST /mcp request from ${req.ip}`);
    let server: Awaited<ReturnType<typeof startServer>> | undefined;
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    try {
      server = await startServer({ readOnly: options.readOnly });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error(`Error handling request: ${error}`);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    } finally {
      if (server) {
        await server.close().catch((closeError) => {
          console.error(`Error closing stateless server: ${closeError}`);
        });
      }
    }
  });

  app.get("/mcp", async (_req: Request, res: Response) => {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "GET not supported for stateless Streamable HTTP" });
  });

  app.delete("/mcp", async (_req: Request, res: Response) => {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "DELETE not supported for stateless Streamable HTTP" });
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      server: "ready",
      mode: "stateless",
      activeSessions: 0,
    });
  });

  app.get("/", (_req: Request, res: Response) => {
    res.status(200).json({
      name: "mcp-server-tron",
      version,
      protocol: `MCP ${MCP_PROTOCOL_VERSION}`,
      transport: "Streamable HTTP",
      mode: "stateless",
      endpoints: {
        mcp: "/mcp",
        health: "/health",
      },
      status: "ready",
      activeSessions: 0,
    });
  });

  return {
    app,
    shutdown: async () => {},
    getActiveSessionCount: () => 0,
  };
}
