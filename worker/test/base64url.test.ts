import { describe, expect, it } from "vitest";
import { b64urlDecode, b64urlEncode } from "../src/base64url";

describe("base64url", () => {
  it("encodes bytes without padding", () => {
    const input = new TextEncoder().encode("hello world");
    const encoded = b64urlEncode(input.buffer);
    expect(encoded).toBe("aGVsbG8gd29ybGQ");
    expect(encoded.includes("=")).toBe(false);
  });

  it("round-trips encode/decode", () => {
    const text = "Grüße aus Zirndorf";
    const bytes = new TextEncoder().encode(text);
    const decoded = b64urlDecode(b64urlEncode(bytes.buffer));
    const result = new TextDecoder().decode(decoded);
    expect(result).toBe(text);
  });
});
