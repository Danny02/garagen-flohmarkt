import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function postJson(path: string, body: unknown): Promise<Response> {
  return SELF.fetch(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function putJson(path: string, body: unknown): Promise<Response> {
  return SELF.fetch(`http://localhost${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function deleteJson(path: string, body: unknown): Promise<Response> {
  return SELF.fetch(`http://localhost${path}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Minimal valid stand payload */
const TEST_LAT = 49.4435;
const TEST_LNG = 10.9525;

const BASE_STAND = {
  address: "Teststraße 1",
  plz: "90513",
  district: "Kernstadt",
  categories: ["Kindersachen"],
  desc: "Test",
  time_from: "10:00",
  time_to: "16:00",
  lat: TEST_LAT,
  lng: TEST_LNG,
};

/** Create a stand and return its response JSON (includes editSecret). */
async function createStand(overrides = {}) {
  const res = await postJson("/api/stands", { ...BASE_STAND, ...overrides });
  return res.json() as Promise<Record<string, unknown>>;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("health check", () => {
  it("GET /api/health returns ok", async () => {
    const res = await SELF.fetch("http://localhost/api/health");
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe("ok");
  });
});

describe("CORS", () => {
  it("OPTIONS returns 204 with CORS headers", async () => {
    const res = await SELF.fetch("http://localhost/api/stands", {
      method: "OPTIONS",
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("GET response includes CORS headers", async () => {
    const res = await SELF.fetch("http://localhost/api/stands");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("GET /api/stands", () => {
  it("returns empty array initially", async () => {
    const res = await SELF.fetch("http://localhost/api/stands");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it("returns created stands", async () => {
    await createStand();
    const res = await SELF.fetch("http://localhost/api/stands");
    const body = await res.json() as unknown[];
    expect(body).toHaveLength(1);
  });

  it("never exposes editSecret", async () => {
    await createStand();
    const res = await SELF.fetch("http://localhost/api/stands");
    const [stand] = await res.json() as Record<string, unknown>[];
    expect(stand.editSecret).toBeUndefined();
  });
});

describe("POST /api/stands", () => {
  it("creates a stand and returns 201 with editSecret", async () => {
    const res = await postJson("/api/stands", BASE_STAND);
    expect(res.status).toBe(201);
    const body = await res.json() as Record<string, unknown>;
    expect(body.id).toBeDefined();
    expect(typeof body.editSecret).toBe("string");
    expect(body.address).toBe(BASE_STAND.address);
    expect(body.approved).toBe(false);
    expect(body.open).toBe(true);
  });

  it("reuses an existing editSecret when creating another stand", async () => {
    const first = await createStand({ address: "Tokenweg 1" });
    const firstEditSecret = first.editSecret as string;
    const secondRes = await postJson("/api/stands", {
      ...BASE_STAND,
      address: "Tokenweg 2",
      editSecret: firstEditSecret,
    });
    expect(secondRes.status).toBe(201);
    const second = await secondRes.json() as Record<string, unknown>;
    expect(second.editSecret).toBe(firstEditSecret);
  });

  it("returns 400 when address is missing", async () => {
    const res = await postJson("/api/stands", { plz: "90513" });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/address/);
  });

  it("returns 400 for unknown category", async () => {
    const res = await postJson("/api/stands", {
      ...BASE_STAND,
      categories: ["UnknownCat"],
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/unknown categories/i);
  });

  it("returns 400 for invalid JSON", async () => {
    const res = await SELF.fetch("http://localhost/api/stands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    expect(res.status).toBe(400);
  });

  it("sets optional label when provided", async () => {
    const res = await postJson("/api/stands", { ...BASE_STAND, label: "Mein Stand" });
    const body = await res.json() as Record<string, unknown>;
    expect(body.label).toBe("Mein Stand");
  });
});

describe("GET /api/stands/:id", () => {
  it("returns the stand without editSecret", async () => {
    const { id } = await createStand();
    const res = await SELF.fetch(`http://localhost/api/stands/${id}`);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.id).toBe(id);
    expect(body.editSecret).toBeUndefined();
  });

  it("returns 404 for unknown id", async () => {
    const res = await SELF.fetch("http://localhost/api/stands/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/stands/:id", () => {
  it("updates stand with correct editSecret", async () => {
    const { id, editSecret } = await createStand();
    const res = await putJson(`/api/stands/${id}`, {
      address: "Neue Str. 99",
      editSecret,
      lat: TEST_LAT,
      lng: TEST_LNG,
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.address).toBe("Neue Str. 99");
    expect(body.editSecret).toBeUndefined();
  });

  it("returns 403 with wrong editSecret", async () => {
    const { id } = await createStand();
    const res = await putJson(`/api/stands/${id}`, {
      address: "Neue Str. 99",
      editSecret: "wrong-secret",
    });
    expect(res.status).toBe(403);
  });

  it("returns 403 with no auth", async () => {
    const { id } = await createStand();
    const res = await putJson(`/api/stands/${id}`, { address: "Neue Str. 99" });
    expect(res.status).toBe(403);
  });

  it("returns 404 for unknown id", async () => {
    const res = await putJson("/api/stands/no-such-id", {
      address: "Test",
      editSecret: "x",
    });
    expect(res.status).toBe(404);
  });

  it("cannot overwrite id or createdAt via PUT", async () => {
    const { id, editSecret, createdAt } = await createStand();
    const res = await putJson(`/api/stands/${id}`, {
      id: "hijacked",
      createdAt: "1970-01-01",
      editSecret,
    });
    const body = await res.json() as Record<string, unknown>;
    expect(body.id).toBe(id);
    expect(body.createdAt).toBe(createdAt);
  });
});

describe("DELETE /api/stands/:id", () => {
  it("deletes stand with correct editSecret", async () => {
    const { id, editSecret } = await createStand();
    const res = await deleteJson(`/api/stands/${id}`, { editSecret });
    expect(res.status).toBe(200);
    const body = await res.json() as { success: boolean };
    expect(body.success).toBe(true);

    // Verify it's gone
    const getRes = await SELF.fetch(`http://localhost/api/stands/${id}`);
    expect(getRes.status).toBe(404);
  });

  it("removes the stand from the list", async () => {
    const { id, editSecret } = await createStand();
    await deleteJson(`/api/stands/${id}`, { editSecret });
    const listRes = await SELF.fetch("http://localhost/api/stands");
    const list = await listRes.json() as unknown[];
    expect(list).toHaveLength(0);
  });

  it("returns 403 with wrong editSecret", async () => {
    const { id } = await createStand();
    const res = await deleteJson(`/api/stands/${id}`, { editSecret: "wrong" });
    expect(res.status).toBe(403);
  });

  it("returns 200 for unknown id (idempotent delete)", async () => {
    const res = await deleteJson("/api/stands/no-such", { editSecret: "x" });
    expect(res.status).toBe(200);
  });
});

describe("404 for unknown routes", () => {
  it("returns 404", async () => {
    const res = await SELF.fetch("http://localhost/api/unknown");
    expect(res.status).toBe(404);
  });
});
