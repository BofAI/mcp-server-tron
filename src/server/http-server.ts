import { createHttpApp } from "./http-app.js";
import { MCP_PROTOCOL_VERSION } from "./server.js";

// Environment variables
const PORT = parseInt(process.env.MCP_PORT || "3001", 10);
const HOST = process.env.MCP_HOST || "0.0.0.0";

console.log(`Configured to listen on ${HOST}:${PORT}`);

const isReadOnly =
  !process.argv.includes("--allow-write") ||
  process.argv.includes("--readonly") ||
  process.argv.includes("-r");
const { app, shutdown } = createHttpApp({
  readOnly: isReadOnly,
  writeToken: process.env.MCP_HTTP_WRITE_TOKEN,
});

// Handle process termination gracefully
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down...");
  await shutdown();
  process.exit(0);
});

// Start the HTTP server
const httpServer = app
  .listen(PORT, HOST, () => {
    console.log(`mcp-server-tron running at http://${HOST}:${PORT}`);
    console.log(`MCP endpoint: http://${HOST}:${PORT}/mcp`);
    console.log(`Health check: http://${HOST}:${PORT}/health`);
    console.log(`Protocol: MCP ${MCP_PROTOCOL_VERSION} (Streamable HTTP)`);
  })
  .on("error", (err: Error) => {
    console.error(`Server error: ${err}`);
    process.exit(1);
  });

// Set server timeout to prevent hanging connections
httpServer.timeout = 120000; // 2 minutes
httpServer.keepAliveTimeout = 65000; // 65 seconds
