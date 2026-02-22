import { describe, expect, it } from "vitest";

describe("test setup", () => {
  it("provides default fetch mock and disables PublicKeyCredential", async () => {
    expect(typeof global.fetch).toBe("function");
    expect(window.PublicKeyCredential).toBeUndefined();
  });
});
