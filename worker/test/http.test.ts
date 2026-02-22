import { describe, expect, it } from "vitest";
import { CORS, errResponse, jsonResponse } from "../src/http";

describe("http helpers", () => {
  it("jsonResponse returns JSON with CORS headers", async () => {
    const res = jsonResponse({ ok: true }, 201);
    expect(res.status).toBe(201);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(CORS["Access-Control-Allow-Origin"]);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("errResponse returns error payload", async () => {
    const res = errResponse("Forbidden", 403);
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
  });
});
