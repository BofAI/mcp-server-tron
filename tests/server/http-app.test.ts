import { beforeEach, describe, expect, it, vi } from "vitest";
import startServer from "../../src/server/server.js";
import { createHttpApp } from "../../src/server/http-app.js";

vi.mock("../../src/server/server.js", () => ({
  default: vi.fn().mockRejectedValue(new Error("init boom")),
  MCP_PROTOCOL_VERSION: "2025-11-25",
  version: "1.1.7",
}));

describe("createHttpApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function post(options?: Parameters<typeof createHttpApp>[0], authorization?: string) {
    const { app } = createHttpApp(options);
    const routeLayer = (app as any)._router.stack.find(
      (layer: any) => layer.route?.path === "/mcp" && layer.route?.methods?.post,
    );

    expect(routeLayer).toBeDefined();
    const handler = routeLayer.route.stack[0].handle as (req: any, res: any) => Promise<void>;

    const res: any = {
      headersSent: false,
      statusCode: 200,
      body: undefined,
      headers: new Map<string, string>(),
      setHeader(name: string, value: string) {
        this.headers.set(name, value);
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        this.body = payload;
        this.headersSent = true;
        return this;
      },
    };

    await handler({ ip: "127.0.0.1", get: () => authorization }, res);
    return res;
  }

  it("defaults to read-only and returns 500 when stateless initialization fails", async () => {
    const res = await post();
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
    expect(startServer).toHaveBeenCalledWith({ readOnly: true });
  });

  it("requires a configured token to create an HTTP write endpoint", () => {
    expect(() => createHttpApp({ readOnly: false })).toThrow("MCP_HTTP_WRITE_TOKEN");
  });

  it.each([undefined, "Basic test-token", "Bearer test-tokeN"])(
    "rejects unauthorized HTTP write requests before MCP initialization",
    async (authorization) => {
      const res = await post({ readOnly: false, writeToken: "test-token" }, authorization);
      expect(res.statusCode).toBe(401);
      expect(res.headers.get("WWW-Authenticate")).toBe('Bearer realm="mcp"');
      expect(startServer).not.toHaveBeenCalled();
    },
  );

  it("initializes write tools for an authenticated request", async () => {
    await post({ readOnly: false, writeToken: "test-token" }, "Bearer test-token");
    expect(startServer).toHaveBeenCalledWith({ readOnly: false });
  });
});
