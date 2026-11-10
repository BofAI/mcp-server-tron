import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "@bankofai/agent-wallet";

describe("agent-wallet configuration with the patched Zod dependency", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  function configDir(config: unknown) {
    const dir = mkdtempSync(join(tmpdir(), "mcp-wallet-config-test-"));
    dirs.push(dir);
    writeFileSync(join(dir, "wallets_config.json"), JSON.stringify(config));
    return dir;
  }

  it("loads supported wallet configuration and preserves mnemonic defaults", () => {
    const dir = configDir({
      active_wallet: "local",
      wallets: {
        local: { type: "local_secure", params: { secret_ref: "test-only-ref" } },
        mnemonic: { type: "raw_secret", params: { source: "mnemonic", mnemonic: "test fixture" } },
      },
    });
    const config = loadConfig(dir);
    expect(config.active_wallet).toBe("local");
    expect(config.wallets.local).toEqual({
      type: "local_secure",
      params: { secret_ref: "test-only-ref" },
    });
    expect(config.wallets.mnemonic.params).toMatchObject({ account_index: 0 });
  });

  it("still rejects wallet types whose parameters do not match", () => {
    const dir = configDir({
      wallets: {
        invalid: { type: "local_secure", params: { source: "mnemonic", mnemonic: "test fixture" } },
      },
    });
    expect(() => loadConfig(dir)).toThrow();
  });
});
