import { describe, expect, it } from "vitest";
import { validateStand } from "../src/validation";

describe("validateStand", () => {
  it("requires a non-empty address", () => {
    expect(validateStand({ address: "   " } as never)).toBe("address is required");
    expect(validateStand({} as never)).toBe("address is required");
  });

  it("rejects unknown categories", () => {
    const result = validateStand({
      address: "Teststraße 1",
      categories: ["Kindersachen", "Unknown"],
    } as never);
    expect(result).toMatch(/unknown categories/i);
  });

  it("accepts valid payload", () => {
    const result = validateStand({
      address: "Teststraße 1",
      categories: ["Kindersachen", "Elektronik"],
    } as never);
    expect(result).toBeNull();
  });
});
