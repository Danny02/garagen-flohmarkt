import { describe, it, expect, beforeEach } from "vitest";
import {
  LS_KEY,
  loadMyStands,
  saveMyStand,
  updateMyStand,
  removeMyStand,
  b64url,
  b64urlDec,
} from "./utils.js";

// localStorage is cleared in test-setup.js afterEach

describe("loadMyStands", () => {
  it("returns empty array when localStorage is empty", () => {
    expect(loadMyStands()).toEqual([]);
  });

  it("returns empty array when localStorage value is invalid JSON", () => {
    localStorage.setItem(LS_KEY, "not-json");
    expect(loadMyStands()).toEqual([]);
  });

  it("returns parsed array when valid data is stored", () => {
    const data = [{ id: "1", address: "Teststr. 1", editSecret: "abc" }];
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    expect(loadMyStands()).toEqual(data);
  });
});

describe("saveMyStand", () => {
  it("adds a new entry", () => {
    const entry = { id: "1", address: "Bahnhofstr. 12", editSecret: "sec" };
    saveMyStand(entry);
    expect(loadMyStands()).toEqual([entry]);
  });

  it("replaces an existing entry with the same id (dedup)", () => {
    const original = { id: "1", address: "Old St. 1", editSecret: "old" };
    const updated = { id: "1", address: "New St. 2", editSecret: "new" };
    saveMyStand(original);
    saveMyStand(updated);
    const list = loadMyStands();
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual(updated);
  });

  it("appends multiple distinct entries", () => {
    saveMyStand({ id: "1", address: "A" });
    saveMyStand({ id: "2", address: "B" });
    expect(loadMyStands()).toHaveLength(2);
  });
});

describe("updateMyStand", () => {
  it("merges patch into matching entry", () => {
    saveMyStand({ id: "1", address: "Teststr. 1", editSecret: "sec" });
    updateMyStand("1", { credentialId: "cred-xyz" });
    const entry = loadMyStands().find((s) => s.id === "1");
    expect(entry.credentialId).toBe("cred-xyz");
    expect(entry.editSecret).toBe("sec"); // original fields preserved
  });

  it("does nothing when id does not match", () => {
    saveMyStand({ id: "1", address: "A" });
    updateMyStand("99", { address: "Changed" });
    expect(loadMyStands()[0].address).toBe("A");
  });
});

describe("removeMyStand", () => {
  it("removes the entry with the given id", () => {
    saveMyStand({ id: "1", address: "A" });
    saveMyStand({ id: "2", address: "B" });
    removeMyStand("1");
    const list = loadMyStands();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("2");
  });

  it("is a no-op when id does not exist", () => {
    saveMyStand({ id: "1", address: "A" });
    removeMyStand("99");
    expect(loadMyStands()).toHaveLength(1);
  });
});

// ── b64url / b64urlDec ─────────────────────────────────────────────────────────

describe("b64url", () => {
  it("encodes an ArrayBuffer to base64url (no padding, url-safe chars)", () => {
    // 3 bytes chosen so base64 would normally use + and /
    const buf = new Uint8Array([0xfb, 0xff, 0xfe]).buffer;
    const result = b64url(buf);
    // Must not contain standard base64 chars + / =
    expect(result).not.toMatch(/[+/=]/);
  });

  it("encodes empty buffer to empty string", () => {
    expect(b64url(new ArrayBuffer(0))).toBe("");
  });

  it("round-trips through b64urlDec", () => {
    const original = new Uint8Array([1, 2, 3, 4, 5, 100, 200, 255]);
    const encoded = b64url(original.buffer);
    const decoded = new Uint8Array(b64urlDec(encoded));
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });

  it("accepts a Uint8Array (non-ArrayBuffer) input", () => {
    const typed = new Uint8Array([65, 66, 67]); // "ABC"
    const result = b64url(typed);
    expect(result).toBe("QUJD");
  });
});

describe("b64urlDec", () => {
  it("decodes back to the original bytes", () => {
    const bytes = new Uint8Array([10, 20, 30, 40]);
    const roundTrip = new Uint8Array(b64urlDec(b64url(bytes.buffer)));
    expect(Array.from(roundTrip)).toEqual(Array.from(bytes));
  });

  it("handles strings without padding", () => {
    // base64url for [0xfb, 0xff, 0xfe] is "-__-" (url-safe)
    const buf = new Uint8Array([0xfb, 0xff, 0xfe]).buffer;
    const encoded = b64url(buf);
    const decoded = new Uint8Array(b64urlDec(encoded));
    expect(decoded[0]).toBe(0xfb);
    expect(decoded[1]).toBe(0xff);
    expect(decoded[2]).toBe(0xfe);
  });
});
