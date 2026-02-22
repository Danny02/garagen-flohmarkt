import { describe, expect, it, vi } from "vitest";
import { getStand, listStandIds, toPublic } from "../src/kv";
import type { Stand } from "../src/types";

function buildStand(): Stand {
  return {
    id: "stand-1",
    address: "Teststraße 1",
    plz: "90513",
    district: "Kernstadt",
    desc: "",
    categories: ["Kindersachen"],
    time_from: "10:00",
    time_to: "16:00",
    open: true,
    approved: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    editSecret: "secret-1",
  };
}

describe("kv helpers", () => {
  it("listStandIds paginates and strips prefixes", async () => {
    const kv = {
      list: vi
        .fn()
        .mockResolvedValueOnce({
          keys: [{ name: "stand:a" }, { name: "stand:b" }],
          list_complete: false,
          cursor: "next",
        })
        .mockResolvedValueOnce({
          keys: [{ name: "stand:c" }],
          list_complete: true,
          cursor: "",
        }),
    } as unknown as KVNamespace;

    const ids = await listStandIds(kv);
    expect(ids).toEqual(["a", "b", "c"]);
    expect(kv.list).toHaveBeenNthCalledWith(1, { prefix: "stand:", cursor: undefined });
    expect(kv.list).toHaveBeenNthCalledWith(2, { prefix: "stand:", cursor: "next" });
  });

  it("getStand reads stand JSON by key", async () => {
    const stand = buildStand();
    const kv = {
      get: vi.fn(async () => stand),
    } as unknown as KVNamespace;

    const result = await getStand(kv, "stand-1");
    expect(kv.get).toHaveBeenCalledWith("stand:stand-1", "json");
    expect(result).toEqual(stand);
  });

  it("toPublic removes editSecret", () => {
    const publicStand = toPublic(buildStand());
    expect(publicStand.id).toBe("stand-1");
    expect((publicStand as Record<string, unknown>).editSecret).toBeUndefined();
  });
});
