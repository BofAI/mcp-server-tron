import { describe, it, expect } from "vitest";
import { listNodes, getNodeInfo } from "../../../src/core/services/index";

describe("Node Services Integration (Nile)", () => {
  it("should list connected nodes", async () => {
    const nodes = await listNodes("nile");
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes.length).toBeGreaterThanOrEqual(0);
  }, 20000);

  it("should get node info with expected structure", async () => {
    const info = await getNodeInfo("nile");
    expect(info).toBeDefined();
    expect(typeof info).toBe("object");
    expect(Object.keys(info).length).toBeGreaterThan(0);
    // Node info should contain known structural keys
    expect(info).toHaveProperty("configNodeInfo");
    expect(info).toHaveProperty("machineInfo");
  }, 20000);
});
