import { describe, expect, it } from "vitest";
import { ALLOWED_CATEGORIES } from "../src/config";

describe("config", () => {
  it("contains expected category values", () => {
    expect(ALLOWED_CATEGORIES.length).toBeGreaterThan(0);
    expect(ALLOWED_CATEGORIES).toContain("Kindersachen");
    expect(ALLOWED_CATEGORIES).toContain("Elektronik");
  });

  it("does not contain duplicates", () => {
    const unique = new Set(ALLOWED_CATEGORIES);
    expect(unique.size).toBe(ALLOWED_CATEGORIES.length);
  });
});
