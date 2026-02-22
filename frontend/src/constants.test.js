import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  DISTRICTS,
  EVENT_BADGE_LABEL,
  EVENT_DATE,
  EVENT_TIME,
  FILTER_ALL_LABEL,
  HOME_STEPS,
  MAP_CENTER,
  MAP_LEGEND_ITEMS,
  STANDS,
} from "./constants.js";

describe("constants", () => {
  it("exports populated filter and map values", () => {
    expect(FILTER_ALL_LABEL).toBe("Alle");
    expect(CATEGORIES[0]).toBe(FILTER_ALL_LABEL);
    expect(DISTRICTS[0]).toBe(FILTER_ALL_LABEL);
    expect(MAP_CENTER.lat).toBeTypeOf("number");
    expect(MAP_CENTER.lng).toBeTypeOf("number");
  });

  it("exports event and home content", () => {
    expect(EVENT_DATE).toContain("2026");
    expect(EVENT_TIME).toContain("Uhr");
    expect(EVENT_BADGE_LABEL).toBe("13.6.");
    expect(HOME_STEPS.length).toBeGreaterThan(0);
    expect(MAP_LEGEND_ITEMS.length).toBeGreaterThan(0);
    expect(Array.isArray(STANDS)).toBe(true);
  });
});
