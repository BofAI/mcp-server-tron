import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import startServer from "./server/server.js";

// Start the server
async function main() {
  try {
    const isReadOnly = process.argv.includes("--readonly") || process.argv.includes("-r");
    const server = await startServer({ readOnly: isReadOnly });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`mcp-server-tron running on stdio${isReadOnly ? " (readonly)" : ""}`);
  } catch (error) {
    console.error("Error starting MCP server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
