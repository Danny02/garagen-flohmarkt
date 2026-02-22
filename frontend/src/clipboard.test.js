import { describe, expect, it, vi } from "vitest";
import { copyText } from "./clipboard.js";

describe("copyText", () => {
  it("uses navigator.clipboard when available", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    copyText("hello");
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("falls back to textarea copy when clipboard API is unavailable", () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(document, "execCommand", {
      value: vi.fn().mockReturnValue(true),
      configurable: true,
    });

    copyText("fallback");
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });
});
