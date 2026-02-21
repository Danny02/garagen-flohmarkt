import { env, SELF } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";

// ── Helpers ───────────────────────────────────────────────────────────────────

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64urlDec(str: string): ArrayBuffer {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

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
const BASE_STAND = {
  address: "Teststraße 1",
  plz: "90513",
  district: "Kernstadt",
  categories: ["Kindersachen"],
  desc: "Test",
  time_from: "10:00",
  time_to: "16:00",
};

/** Create a stand and return its response JSON (includes editSecret). */
async function createStand(overrides = {}) {
  const res = await postJson("/api/stands", { ...BASE_STAND, ...overrides });
  return res.json() as Promise<Record<string, unknown>>;
}

// ── WebAuthn test helpers ─────────────────────────────────────────────────────

/** Build a minimal authenticatorData buffer with the correct rpIdHash. */
async function buildAuthData(origin: string): Promise<Uint8Array> {
  const rpId = new URL(origin).hostname;
  const rpIdHash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(rpId)
  );
  const authData = new Uint8Array(37);
  authData.set(new Uint8Array(rpIdHash));
  authData[32] = 0x01; // UP (user present) flag
  // bytes 33-36: signCount = 0
  return authData;
}

/** Construct a signed WebAuthn assertion using a test P-256 key pair. */
async function buildAssertion(
  privateKey: CryptoKey,
  challenge: string,
  origin = "http://localhost"
): Promise<{ authenticatorData: string; clientDataJSON: string; signature: string }> {
  const authData = await buildAuthData(origin);
  const clientDataJSON = JSON.stringify({
    type: "webauthn.get",
    challenge,
    origin,
    crossOrigin: false,
  });
  const clientDataBytes = new TextEncoder().encode(clientDataJSON);
  const clientDataHash = await crypto.subtle.digest("SHA-256", clientDataBytes);

  // verifyData = authData || SHA-256(clientDataJSON)
  const verifyData = new Uint8Array(authData.length + 32);
  verifyData.set(authData);
  verifyData.set(new Uint8Array(clientDataHash), authData.length);

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    verifyData
  );

  return {
    authenticatorData: b64url(authData),
    clientDataJSON: b64url(clientDataBytes),
    signature: b64url(signature),
  };
}

/** Register a passkey for a stand and return the credentialId. */
async function registerPasskeyForStand(
  standId: string,
  editSecret: string,
  publicKey: CryptoKey,
  credentialId: string,
  origin = "http://localhost"
): Promise<void> {
  const challengeRes = await postJson("/api/webauthn/challenge", {});
  const { challengeId, challenge } = (await challengeRes.json()) as {
    challengeId: string;
    challenge: string;
  };

  const spki = await crypto.subtle.exportKey("spki", publicKey);
  const clientDataJSON = JSON.stringify({
    type: "webauthn.create",
    challenge,
    origin,
    crossOrigin: false,
  });

  const res = await postJson(`/api/stands/${standId}/webauthn/register`, {
    editSecret,
    challengeId,
    credentialId,
    publicKey: b64url(spki),
    clientDataJSON: b64url(new TextEncoder().encode(clientDataJSON)),
  });
  if (!res.ok) {
    const body = await res.json() as { error?: string };
    throw new Error(`passkey register failed: ${body.error}`);
  }
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

  it("returns 404 for unknown id", async () => {
    const res = await deleteJson("/api/stands/no-such", { editSecret: "x" });
    expect(res.status).toBe(404);
  });
});

describe("404 for unknown routes", () => {
  it("returns 404", async () => {
    const res = await SELF.fetch("http://localhost/api/unknown");
    expect(res.status).toBe(404);
  });
});

describe("WebAuthn – challenge", () => {
  it("POST /api/webauthn/challenge returns challengeId and challenge", async () => {
    const res = await postJson("/api/webauthn/challenge", {});
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(typeof body.challengeId).toBe("string");
    expect(typeof body.challenge).toBe("string");
    // challenge should be a non-empty base64url string
    expect((body.challenge as string).length).toBeGreaterThan(10);
  });

  it("each challenge is unique", async () => {
    const a = (await (await postJson("/api/webauthn/challenge", {})).json()) as { challenge: string };
    const b = (await (await postJson("/api/webauthn/challenge", {})).json()) as { challenge: string };
    expect(a.challenge).not.toBe(b.challenge);
  });
});

describe("WebAuthn – passkey registration", () => {
  it("registers a passkey credential for a stand", async () => {
    const { id, editSecret } = await createStand();
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );
    const credentialId = "test-cred-" + crypto.randomUUID();

    // Should not throw
    await expect(
      registerPasskeyForStand(id as string, editSecret as string, keyPair.publicKey, credentialId)
    ).resolves.not.toThrow();
  });

  it("rejects registration with wrong editSecret", async () => {
    const { id } = await createStand();
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );
    const spki = await crypto.subtle.exportKey("spki", keyPair.publicKey);

    const challengeRes = await postJson("/api/webauthn/challenge", {});
    const { challengeId, challenge } = await challengeRes.json() as {
      challengeId: string;
      challenge: string;
    };
    const clientDataJSON = JSON.stringify({
      type: "webauthn.create",
      challenge,
      origin: "http://localhost",
      crossOrigin: false,
    });

    const res = await postJson(`/api/stands/${id}/webauthn/register`, {
      editSecret: "wrong-secret",
      challengeId,
      credentialId: "cred-1",
      publicKey: b64url(spki),
      clientDataJSON: b64url(new TextEncoder().encode(clientDataJSON)),
    });
    expect(res.status).toBe(403);
  });
});

describe("WebAuthn – full authentication flow", () => {
  it("authenticates and returns a sessionToken that can be used for PUT", async () => {
    const { id, editSecret } = await createStand();
    const credentialId = "e2e-cred-" + crypto.randomUUID();

    // Generate key pair
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    // Register the passkey
    await registerPasskeyForStand(
      id as string,
      editSecret as string,
      keyPair.publicKey,
      credentialId
    );

    // Get challenge for authentication
    const challengeRes = await postJson("/api/webauthn/challenge", {});
    const { challengeId, challenge } = (await challengeRes.json()) as {
      challengeId: string;
      challenge: string;
    };

    // Build and sign assertion
    const assertion = await buildAssertion(keyPair.privateKey, challenge);

    // Authenticate
    const authRes = await postJson("/api/webauthn/authenticate", {
      challengeId,
      credentialId,
      ...assertion,
    });
    expect(authRes.status).toBe(200);
    const { standId, sessionToken } = (await authRes.json()) as {
      standId: string;
      sessionToken: string;
    };
    expect(standId).toBe(id);
    expect(typeof sessionToken).toBe("string");

    // Use sessionToken for PUT
    const updateRes = await putJson(`/api/stands/${id}`, {
      address: "Updated via Passkey",
      sessionToken,
    });
    expect(updateRes.status).toBe(200);
    const updated = (await updateRes.json()) as { address: string };
    expect(updated.address).toBe("Updated via Passkey");
  });

  it("rejects authentication with wrong signature", async () => {
    const { id, editSecret } = await createStand();
    const credentialId = "bad-sig-cred-" + crypto.randomUUID();

    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );
    await registerPasskeyForStand(
      id as string,
      editSecret as string,
      keyPair.publicKey,
      credentialId
    );

    // Use a *different* key pair to sign (wrong signature)
    const wrongKeyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    const challengeRes = await postJson("/api/webauthn/challenge", {});
    const { challengeId, challenge } = (await challengeRes.json()) as {
      challengeId: string;
      challenge: string;
    };
    const assertion = await buildAssertion(wrongKeyPair.privateKey, challenge);

    const authRes = await postJson("/api/webauthn/authenticate", {
      challengeId,
      credentialId,
      ...assertion,
    });
    expect(authRes.status).toBe(403);
  });

  it("rejects a replayed challenge", async () => {
    const { id, editSecret } = await createStand();
    const credentialId = "replay-cred-" + crypto.randomUUID();
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );
    await registerPasskeyForStand(
      id as string,
      editSecret as string,
      keyPair.publicKey,
      credentialId
    );

    const challengeRes = await postJson("/api/webauthn/challenge", {});
    const { challengeId, challenge } = (await challengeRes.json()) as {
      challengeId: string;
      challenge: string;
    };
    const assertion = await buildAssertion(keyPair.privateKey, challenge);

    // First use – should succeed
    const first = await postJson("/api/webauthn/authenticate", {
      challengeId,
      credentialId,
      ...assertion,
    });
    expect(first.status).toBe(200);

    // Second use of same challenge – should fail (challenge was deleted after use)
    const second = await postJson("/api/webauthn/authenticate", {
      challengeId,
      credentialId,
      ...assertion,
    });
    expect(second.status).toBe(400); // challenge expired/not found
  });

  it("sessionToken grants PUT for the correct stand only", async () => {
    const { id: id1, editSecret: s1 } = await createStand({ address: "Stand A" });
    const { id: id2 } = await createStand({ address: "Stand B" });

    const credentialId = "scope-cred-" + crypto.randomUUID();
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );
    await registerPasskeyForStand(
      id1 as string,
      s1 as string,
      keyPair.publicKey,
      credentialId
    );

    const challengeRes = await postJson("/api/webauthn/challenge", {});
    const { challengeId, challenge } = (await challengeRes.json()) as {
      challengeId: string;
      challenge: string;
    };
    const assertion = await buildAssertion(keyPair.privateKey, challenge);
    const authRes = await postJson("/api/webauthn/authenticate", {
      challengeId,
      credentialId,
      ...assertion,
    });
    const { sessionToken } = (await authRes.json()) as { sessionToken: string };

    // Token is valid for stand 1
    const ok = await putJson(`/api/stands/${id1}`, {
      address: "A updated",
      sessionToken,
    });
    expect(ok.status).toBe(200);

    // Token is NOT valid for stand 2
    const fail = await putJson(`/api/stands/${id2}`, {
      address: "B updated",
      sessionToken,
    });
    expect(fail.status).toBe(403);
  });
});
