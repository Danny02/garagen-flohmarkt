import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { b64urlDecode, b64urlEncode } from "../src/base64url";

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

async function createStand(overrides = {}) {
  const res = await postJson("/api/stands", { ...BASE_STAND, ...overrides });
  return res.json() as Promise<Record<string, unknown>>;
}

async function buildAuthData(origin: string): Promise<Uint8Array> {
  const rpId = new URL(origin).hostname;
  const rpIdHash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(rpId)
  );
  const authData = new Uint8Array(37);
  authData.set(new Uint8Array(rpIdHash));
  authData[32] = 0x01;
  return authData;
}

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

  const verifyData = new Uint8Array(authData.length + 32);
  verifyData.set(authData);
  verifyData.set(new Uint8Array(clientDataHash), authData.length);

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    verifyData
  );

  return {
    authenticatorData: b64urlEncode(authData.buffer),
    clientDataJSON: b64urlEncode(clientDataBytes.buffer),
    signature: b64urlEncode(signature),
  };
}

function rawEcdsaToDer(rawSig: Uint8Array): Uint8Array {
  const fieldSize = rawSig.length / 2;
  let r = rawSig.slice(0, fieldSize);
  let s = rawSig.slice(fieldSize);

  while (r.length > 1 && r[0] === 0x00 && (r[1] & 0x80) === 0) r = r.slice(1);
  while (s.length > 1 && s[0] === 0x00 && (s[1] & 0x80) === 0) s = s.slice(1);
  if (r[0] & 0x80) r = new Uint8Array([0x00, ...r]);
  if (s[0] & 0x80) s = new Uint8Array([0x00, ...s]);

  const contentLen = 2 + r.length + 2 + s.length;
  const out = new Uint8Array(2 + contentLen);
  let idx = 0;
  out[idx++] = 0x30;
  out[idx++] = contentLen;
  out[idx++] = 0x02;
  out[idx++] = r.length;
  out.set(r, idx);
  idx += r.length;
  out[idx++] = 0x02;
  out[idx++] = s.length;
  out.set(s, idx);

  return out;
}

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
    publicKey: b64urlEncode(spki),
    clientDataJSON: b64urlEncode(new TextEncoder().encode(clientDataJSON).buffer),
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(`passkey register failed: ${body.error}`);
  }
}

describe("WebAuthn – challenge", () => {
  it("POST /api/webauthn/challenge returns challengeId and challenge", async () => {
    const res = await postJson("/api/webauthn/challenge", {});
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body.challengeId).toBe("string");
    expect(typeof body.challenge).toBe("string");
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
    const { challengeId, challenge } = (await challengeRes.json()) as {
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
      publicKey: b64urlEncode(spki),
      clientDataJSON: b64urlEncode(new TextEncoder().encode(clientDataJSON).buffer),
    });
    expect(res.status).toBe(403);
  });
});

describe("WebAuthn – full authentication flow", () => {
  it("authenticates and returns a sessionToken that can be used for PUT", async () => {
    const { id, editSecret } = await createStand();
    const credentialId = "e2e-cred-" + crypto.randomUUID();

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
    const authRes = await postJson("/api/webauthn/authenticate", {
      challengeId,
      credentialId,
      ...assertion,
    });
    expect(authRes.status).toBe(200);
    const { sessionToken } = (await authRes.json()) as {
      sessionToken: string;
    };
    expect(typeof sessionToken).toBe("string");

    const updateRes = await putJson(`/api/stands/${id}`, {
      address: "Updated via Passkey",
      sessionToken,
      lat: TEST_LAT,
      lng: TEST_LNG,
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

    const first = await postJson("/api/webauthn/authenticate", {
      challengeId,
      credentialId,
      ...assertion,
    });
    expect(first.status).toBe(200);

    const second = await postJson("/api/webauthn/authenticate", {
      challengeId,
      credentialId,
      ...assertion,
    });
    expect(second.status).toBe(400);
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

    const ok = await putJson(`/api/stands/${id1}`, {
      address: "A updated",
      sessionToken,
      lat: TEST_LAT,
      lng: TEST_LNG,
    });
    expect(ok.status).toBe(200);

    const fail = await putJson(`/api/stands/${id2}`, {
      address: "B updated",
      sessionToken,
    });
    expect(fail.status).toBe(403);
  });

  it("sessionToken grants PUT for all stands of the same owner", async () => {
    const first = await createStand({ address: "Ownerweg 1" });
    const firstId = first.id as string;
    const firstEditSecret = first.editSecret as string;
    const secondRes = await postJson("/api/stands", {
      ...BASE_STAND,
      address: "Ownerweg 2",
      editSecret: firstEditSecret,
    });
    const second = (await secondRes.json()) as { id: string };

    const credentialId = "owner-scope-cred-" + crypto.randomUUID();
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    await registerPasskeyForStand(
      firstId,
      firstEditSecret,
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

    const updateFirst = await putJson(`/api/stands/${firstId}`, {
      address: "Ownerweg 1 updated",
      sessionToken,
      lat: TEST_LAT,
      lng: TEST_LNG,
    });
    expect(updateFirst.status).toBe(200);

    const updateSecond = await putJson(`/api/stands/${second.id}`, {
      address: "Ownerweg 2 updated",
      sessionToken,
      lat: TEST_LAT,
      lng: TEST_LNG,
    });
    expect(updateSecond.status).toBe(200);

    const myStandsRes = await postJson("/api/my/stands", { sessionToken });
    expect(myStandsRes.status).toBe(200);
    const myStands = (await myStandsRes.json()) as { id: string }[];
    const ids = myStands.map((stand) => stand.id);
    expect(ids).toContain(firstId);
    expect(ids).toContain(second.id);
  });

  it("accepts DER-encoded ECDSA signatures", async () => {
    const { id, editSecret } = await createStand();
    const credentialId = "der-ecdsa-cred-" + crypto.randomUUID();

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
    const rawSig = new Uint8Array(b64urlDecode(assertion.signature));
    const derSig = rawEcdsaToDer(rawSig);

    const authRes = await postJson("/api/webauthn/authenticate", {
      challengeId,
      credentialId,
      authenticatorData: assertion.authenticatorData,
      clientDataJSON: assertion.clientDataJSON,
      signature: b64urlEncode(derSig.buffer),
    });

    expect(authRes.status).toBe(200);
  });
});
