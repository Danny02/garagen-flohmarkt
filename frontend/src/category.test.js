import { describe, expect, it } from "vitest";
import { getCatIcon } from "./category.js";

describe("getCatIcon", () => {
  it("returns configured icon for known categories", () => {
    expect(getCatIcon("Kindersachen")).not.toBe("?");
  });

  it("returns fallback for unknown categories", () => {
    expect(getCatIcon("Nope")).toBe("?");
  });
});
