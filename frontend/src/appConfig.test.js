import { describe, expect, it } from "vitest";
import { APP_CONFIG } from "./appConfig.js";

describe("APP_CONFIG", () => {
  it("contains event and catalog basics", () => {
    expect(APP_CONFIG.event.startAt).toContain("2026-06-13");
    expect(APP_CONFIG.catalog.districts.length).toBeGreaterThan(0);
    expect(APP_CONFIG.catalog.categories.length).toBeGreaterThan(0);
  });

  it("defines register defaults", () => {
    expect(APP_CONFIG.register.defaults.plz).toBe("90513");
    expect(APP_CONFIG.register.defaults.timeFrom).toBeDefined();
    expect(APP_CONFIG.register.defaults.timeTo).toBeDefined();
  });
});
