import { afterEach, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { gzipSync } from "node:zlib";
import { createHttpApp } from "../../src/server/http-app.js";

describe("HTTP JSON input boundary", () => {
  let server: Server | undefined;
  afterEach(async () => {
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = undefined;
  });

  it("accepts ordinary JSON and rejects compressed and oversized bodies", async () => {
    const { app } = createHttpApp({ readOnly: true });
    app.post("/input-control", (req, res) => res.json(req.body));
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve, reject) => {
      server!.once("listening", resolve);
      server!.once("error", reject);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing test server address");
    const url = `http://127.0.0.1:${address.port}/input-control`;
    const normal = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: '{"ok":true}',
    });
    expect(normal.status).toBe(200);
    expect(await normal.json()).toEqual({ ok: true });
    const compressed = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "content-encoding": "gzip" },
      body: gzipSync('{"ok":true}'),
    });
    expect(compressed.status).toBe(415);
    const oversized = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "x".repeat(1024 * 1024) }),
    });
    expect(oversized.status).toBe(413);
    const alive = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    expect(alive.status).toBe(200);
  });
});
