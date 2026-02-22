import { describe, expect, it, vi } from "vitest";
import { isAuthorized } from "../src/auth";
import type { Session, Stand } from "../src/types";

function buildStand(): Stand {
  return {
    id: "stand-1",
    address: "Teststraße 1",
    plz: "90513",
    district: "Kernstadt",
    desc: "",
    categories: [],
    time_from: "10:00",
    time_to: "16:00",
    open: true,
    approved: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    editSecret: "owner-secret",
  };
}

describe("isAuthorized", () => {
  it("accepts matching editSecret", async () => {
    const kv = { get: vi.fn() } as unknown as KVNamespace;
    const ok = await isAuthorized({ editSecret: "owner-secret" }, buildStand(), kv);
    expect(ok).toBe(true);
    expect(kv.get).not.toHaveBeenCalled();
  });

  it("accepts valid session with matching userToken", async () => {
    const session: Session = {
      userToken: "owner-secret",
      expiresAt: Date.now() + 60_000,
    };
    const kv = {
      get: vi.fn(async () => session),
    } as unknown as KVNamespace;

    const ok = await isAuthorized({ sessionToken: "session-1" }, buildStand(), kv);
    expect(ok).toBe(true);
  });

  it("accepts legacy stand-scoped session", async () => {
    const session: Session = {
      userToken: "",
      standId: "stand-1",
      expiresAt: Date.now() + 60_000,
    };
    const kv = {
      get: vi.fn(async () => session),
    } as unknown as KVNamespace;

    const ok = await isAuthorized({ sessionToken: "session-2" }, buildStand(), kv);
    expect(ok).toBe(true);
  });

  it("rejects expired or mismatched auth", async () => {
    const session: Session = {
      userToken: "different-owner",
      expiresAt: Date.now() - 1,
    };
    const kv = {
      get: vi.fn(async () => session),
    } as unknown as KVNamespace;

    const ok = await isAuthorized({ sessionToken: "session-3" }, buildStand(), kv);
    expect(ok).toBe(false);
  });
});