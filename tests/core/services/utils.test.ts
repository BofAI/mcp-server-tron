import { describe, expect, it } from "vitest";
// import { utils } from "../../../src/core/services/utils";
// We will import utils directly which imports tronweb
import { parseTRC20Decimals, utils } from "../../../src/core/services/utils";

describe("Utils", () => {
  it.each([
    [0, 0],
    [6n, 6],
    ["18", 18],
    [255n, 255],
  ])("accepts bounded TRC20 precision %s", (value, expected) => {
    expect(parseTRC20Decimals(value)).toBe(expected);
  });

  it.each([256n, -1n, 1.5, "1e2", "6\n", "", true, [6]])(
    "rejects invalid TRC20 precision %s",
    (value) => {
      expect(() => parseTRC20Decimals(value)).toThrow("integer from 0 to 255");
    },
  );

  it("should convert TRX to Sun", () => {
    expect(utils.toSun(1)).toBe("1000000");
    expect(utils.toSun("1")).toBe("1000000");
    expect(utils.toSun(1.5)).toBe("1500000");
  });

  it("should convert Sun to TRX", () => {
    expect(utils.fromSun(1000000)).toBe("1");
    expect(utils.fromSun("1000000")).toBe("1");
    expect(utils.fromSun(1500000)).toBe("1.5");
  });

  it("should format bigints", () => {
    const big = BigInt("12345678901234567890");
    expect(utils.formatBigInt(big)).toBe("12345678901234567890");
  });

  it("should hex to number", () => {
    expect(utils.hexToNumber("0xa")).toBe(10);
    expect(utils.hexToNumber("a")).toBe(10);
  });

  it("should number to hex", () => {
    expect(utils.numberToHex(10)).toBe("0xa");
    expect(utils.numberToHex(255)).toBe("0xff");
  });

  it("should check isAddress", () => {
    // Valid Tron Address (mocked)
    expect(utils.isAddress("T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb")).toBe(true);
    // Invalid
    expect(utils.isAddress("InvalidAddress")).toBe(false);
  });
});
