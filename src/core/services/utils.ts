// Fix TypeScript error: TronWeb.fromSun returns string, but we can pass string to it (TronWeb types might be outdated or strict)

import { TronWeb } from "tronweb";

export function parseTRC20Decimals(value: unknown): number {
  if (typeof value === "bigint" || typeof value === "number" || typeof value === "string") {
    const digits = String(value);
    if (digits.length > 0 && digits.length <= 3 && !/\D/.test(digits)) {
      const decimals = Number(digits);
      if (decimals <= 255) {
        return decimals;
      }
    }
  }
  throw new Error("TRC20 decimals must be an integer from 0 to 255");
}

// Note: TronWeb handles most of these conversions internally or via utility methods.
// We are wrapping them here for consistent API usage across the application.

/**
 * Utility functions for formatting and parsing values
 */
export const utils = {
  // Convert Tron (ether equivalent) to Sun (wei equivalent)
  // 1 TRX = 1,000,000 SUN
  toSun: (trx: number | string): string => {
    return TronWeb.toSun(trx as any).toString();
  },

  // Convert Sun to Tron
  fromSun: (sun: number | string | bigint): string => {
    return TronWeb.fromSun(sun.toString() as any).toString();
  },

  // Format a bigint/number to a string
  formatBigInt: (value: bigint | number): string => value.toString(),

  // Format an object to JSON with bigint handling
  formatJson: (obj: unknown): string =>
    JSON.stringify(obj, (_, value) => (typeof value === "bigint" ? value.toString() : value), 2),

  // Format a number with commas
  formatNumber: (value: number | string): string => {
    return Number(value).toLocaleString();
  },

  // Convert a hex string to a number
  hexToNumber: (hex: string): number => {
    return parseInt(hex, 16);
  },

  // Convert a number to a hex string
  numberToHex: (num: number): string => {
    return "0x" + num.toString(16);
  },

  // Tron specific utils
  isAddress: (address: string): boolean => {
    return TronWeb.isAddress(address);
  },
};
