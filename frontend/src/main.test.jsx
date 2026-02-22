import { describe, expect, it } from "vitest";
import source from "./main.jsx?raw";

describe("main bootstrap source", () => {
  it("registers service worker and renders App in StrictMode", () => {
    expect(source).toContain('registerSW({ immediate: true })');
    expect(source).toContain("createRoot(document.getElementById(\"root\")).render(");
    expect(source).toContain("<StrictMode>");
    expect(source).toContain("<App />");
  });
});
