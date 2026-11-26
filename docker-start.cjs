/* eslint-disable @typescript-eslint/no-require-imports */

const { spawn } = require("node:child_process");
const { closeSync, mkdirSync, openSync } = require("node:fs");
const { join } = require("node:path");

const logDirectory = process.env.MCP_LOG_DIR || "/app/logs";
const now = new Date();
const month = String(now.getMonth() + 1).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");
const logPrefix = `mcp-server-tron-${now.getFullYear()}-${month}-${day}`;

mkdirSync(logDirectory, { recursive: true });
const stdout = openSync(join(logDirectory, `${logPrefix}-combined.log`), "a", 0o640);
const stderr = openSync(join(logDirectory, `${logPrefix}-error.log`), "a", 0o640);
const server = spawn(process.execPath, ["build/server/http-server.js", "--readonly"], {
  stdio: ["inherit", stdout, stderr],
});
closeSync(stdout);
closeSync(stderr);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}
server.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
server.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
