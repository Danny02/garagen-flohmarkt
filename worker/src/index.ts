/**
 * Garagen-Flohmarkt Zirndorf – Cloudflare Worker
 *
 * Auth model
 * ──────────
 *  • POST /api/stands              → creates stand, returns {stand, editSecret} one-time
 *  • PUT  /api/stands/:id          → body: { editSecret } OR { sessionToken }
 *  • DELETE /api/stands/:id        → body: { editSecret } OR { sessionToken }
 *
 * Passkey (WebAuthn) flow
 * ───────────────────────
 *  1. POST /api/webauthn/challenge            → {challengeId, challenge}
 *  2. POST /api/stands/:id/webauthn/register  → register a passkey (requires editSecret)
 *  3. POST /api/webauthn/authenticate         → verify assertion → {standId, sessionToken}
 *
 * KV keys
 * ───────
 *  "stands:index"          → string[]          ordered list of stand IDs
 *  "stand:{id}"            → Stand             full record incl. editSecret
 *  "challenge:{challengeId}" → {challenge, expiresAt}
 *  "credential:{credentialId}" → {standId, publicKey (base64url SPKI)}
 *  "credentialRef:{standId}"   → credentialId  (lookup by stand)
 *  "session:{token}"       → {standId, expiresAt}
 */

export interface Env {
  GARAGEN_KV: KVNamespace;
  /**
   * Comma-separated list of allowed WebAuthn origins.
   * e.g. "https://garagen-flohmarkt.pages.dev,http://localhost:5173"
   * If unset, origin checking is skipped (dev-only).
   */
  ALLOWED_ORIGINS?: string;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Stand {
  id: string;
  label?: string;
  address: string;
  plz: string;
  district: string;
  desc: string;
  categories: string[];
  time_from: string;
  time_to: string;
  lat?: number;
  lng?: number;
  open: boolean;
  approved: boolean;
  createdAt: string;
  editSecret: string; // never returned in GET responses
}

type StandPublic = Omit<Stand, "editSecret">;

interface Challenge {
  challenge: string; // base64url random bytes
  expiresAt: number;
}

interface StoredCredential {
  standId: string;
  publicKey: string; // base64url SPKI (DER) encoded
}

interface Session {
  standId: string;
  expiresAt: number;
}

// ── CORS ─────────────────────────────────────────────────────────────────────

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
function errResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

// ── Base64url helpers ─────────────────────────────────────────────────────────

function b64urlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64urlDecode(str: string): ArrayBuffer {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

// ── KV helpers ────────────────────────────────────────────────────────────────

async function getIndex(kv: KVNamespace): Promise<string[]> {
  const raw = await kv.get("stands:index");
  return raw ? (JSON.parse(raw) as string[]) : [];
}
async function setIndex(kv: KVNamespace, ids: string[]): Promise<void> {
  await kv.put("stands:index", JSON.stringify(ids));
}
async function getStand(kv: KVNamespace, id: string): Promise<Stand | null> {
  return kv.get<Stand>(`stand:${id}`, "json");
}
function toPublic(s: Stand): StandPublic {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { editSecret: _s, ...pub } = s;
  return pub;
}

// ── Auth helper: editSecret OR sessionToken ───────────────────────────────────

async function isAuthorized(
  body: Record<string, unknown>,
  stand: Stand,
  kv: KVNamespace
): Promise<boolean> {
  if (body.editSecret && body.editSecret === stand.editSecret) return true;
  if (typeof body.sessionToken === "string") {
    const session = await kv.get<Session>(`session:${body.sessionToken}`, "json");
    if (session && session.standId === stand.id && session.expiresAt > Date.now()) {
      return true;
    }
  }
  return false;
}

// ── Validation ────────────────────────────────────────────────────────────────

const ALLOWED_CATEGORIES = [
  "Kindersachen", "Buecher", "Moebel", "Vintage", "Kleidung",
  "Haushalt", "Spielzeug", "Garten", "Werkzeug", "Elektronik", "Medien",
];

function validateStand(body: Partial<Stand>): string | null {
  if (!body.address?.trim()) return "address is required";
  if (body.categories) {
    const invalid = (body.categories as string[]).filter((c) => !ALLOWED_CATEGORIES.includes(c));
    if (invalid.length > 0) return `unknown categories: ${invalid.join(", ")}`;
  }
  return null;
}

// ── WebAuthn helpers ──────────────────────────────────────────────────────────

async function verifyWebAuthnAssertion(
  assertion: {
    credentialId: string;
    authenticatorData: string;  // base64url
    clientDataJSON: string;     // base64url
    signature: string;          // base64url DER-encoded ECDSA
  },
  storedPublicKey: string, // base64url SPKI
  storedChallenge: string, // base64url
  allowedOrigins: string[] | null
): Promise<true | string> {
  // 1. Decode and parse clientDataJSON
  const clientDataBytes = b64urlDecode(assertion.clientDataJSON);
  const clientData = JSON.parse(new TextDecoder().decode(clientDataBytes)) as {
    type: string;
    challenge: string;
    origin: string;
  };

  if (clientData.type !== "webauthn.get") return "clientData.type mismatch";
  if (clientData.challenge !== storedChallenge) return "challenge mismatch";
  if (allowedOrigins && !allowedOrigins.includes(clientData.origin)) {
    return `origin not allowed: ${clientData.origin}`;
  }

  // 2. Verify RP ID hash (first 32 bytes of authenticatorData)
  const authDataBytes = new Uint8Array(b64urlDecode(assertion.authenticatorData));
  const rpId = new URL(clientData.origin).hostname;
  const expectedRpIdHash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rpId))
  );
  for (let i = 0; i < 32; i++) {
    if (authDataBytes[i] !== expectedRpIdHash[i]) return "rpId hash mismatch";
  }

  // 3. Check user-present flag (bit 0 of flags byte at index 32)
  if (!(authDataBytes[32] & 0x01)) return "user not present";

  // 4. Compute verification data: authData || SHA-256(clientDataJSON)
  const clientDataHash = await crypto.subtle.digest("SHA-256", clientDataBytes);
  const verifyData = new Uint8Array(authDataBytes.length + 32);
  verifyData.set(authDataBytes);
  verifyData.set(new Uint8Array(clientDataHash), authDataBytes.length);

  // 5. Import public key and verify signature
  const publicKey = await crypto.subtle.importKey(
    "spki",
    b64urlDecode(storedPublicKey),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );

  const valid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    b64urlDecode(assertion.signature),
    verifyData
  );

  return valid ? true : "signature verification failed";
}

// ── Worker ────────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const allowedOrigins = env.ALLOWED_ORIGINS
      ? env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
      : null;

    // ── GET /api/stands ───────────────────────────────────────────────────────
    if (pathname === "/api/stands" && method === "GET") {
      const ids = await getIndex(env.GARAGEN_KV);
      const stands = (
        await Promise.all(ids.map((id) => getStand(env.GARAGEN_KV, id)))
      ).filter((s): s is Stand => s !== null);
      return jsonResponse(stands.map(toPublic));
    }

    // ── POST /api/stands ──────────────────────────────────────────────────────
    if (pathname === "/api/stands" && method === "POST") {
      let body: Partial<Stand>;
      try { body = (await request.json()) as Partial<Stand>; }
      catch { return errResponse("Invalid JSON"); }

      const ve = validateStand(body);
      if (ve) return errResponse(ve);

      const id = crypto.randomUUID();
      const editSecret = crypto.randomUUID();
      const stand: Stand = {
        id,
        label: body.label?.trim() || undefined,
        address: body.address!.trim(),
        plz: body.plz?.trim() || "90513",
        district: body.district?.trim() || "Kernstadt",
        desc: body.desc?.trim() || "",
        categories: body.categories || [],
        time_from: body.time_from || "10:00",
        time_to: body.time_to || "16:00",
        lat: body.lat,
        lng: body.lng,
        open: true,
        approved: false,
        createdAt: new Date().toISOString(),
        editSecret,
      };

      await env.GARAGEN_KV.put(`stand:${id}`, JSON.stringify(stand));
      const ids = await getIndex(env.GARAGEN_KV);
      await setIndex(env.GARAGEN_KV, [...ids, id]);

      // editSecret returned ONCE – client must persist it
      return jsonResponse({ ...toPublic(stand), editSecret }, 201);
    }

    // ── /api/stands/:id ───────────────────────────────────────────────────────
    const idMatch = pathname.match(/^\/api\/stands\/([^/]+)$/);
    if (idMatch) {
      const id = idMatch[1];

      if (method === "GET") {
        const stand = await getStand(env.GARAGEN_KV, id);
        if (!stand) return errResponse("Not found", 404);
        return jsonResponse(toPublic(stand));
      }

      if (method === "PUT") {
        const existing = await getStand(env.GARAGEN_KV, id);
        if (!existing) return errResponse("Not found", 404);
        let body: Partial<Stand> & { editSecret?: string; sessionToken?: string };
        try { body = (await request.json()) as typeof body; }
        catch { return errResponse("Invalid JSON"); }
        if (!(await isAuthorized(body as Record<string, unknown>, existing, env.GARAGEN_KV))) {
          return errResponse("Forbidden", 403);
        }
        const ve = validateStand({ ...existing, ...body });
        if (ve) return errResponse(ve);
        const updated: Stand = {
          ...existing,
          label: body.label?.trim() ?? existing.label,
          address: body.address?.trim() || existing.address,
          plz: body.plz?.trim() || existing.plz,
          district: body.district?.trim() || existing.district,
          desc: body.desc?.trim() ?? existing.desc,
          categories: body.categories || existing.categories,
          time_from: body.time_from || existing.time_from,
          time_to: body.time_to || existing.time_to,
          lat: body.lat ?? existing.lat,
          lng: body.lng ?? existing.lng,
          // immutable
          id, editSecret: existing.editSecret, createdAt: existing.createdAt,
          approved: existing.approved,
        };
        await env.GARAGEN_KV.put(`stand:${id}`, JSON.stringify(updated));
        return jsonResponse(toPublic(updated));
      }

      if (method === "DELETE") {
        const existing = await getStand(env.GARAGEN_KV, id);
        if (!existing) return errResponse("Not found", 404);
        let body: { editSecret?: string; sessionToken?: string };
        try { body = (await request.json()) as typeof body; }
        catch { return errResponse("Invalid JSON"); }
        if (!(await isAuthorized(body as Record<string, unknown>, existing, env.GARAGEN_KV))) {
          return errResponse("Forbidden", 403);
        }
        await env.GARAGEN_KV.delete(`stand:${id}`);
        const ids = await getIndex(env.GARAGEN_KV);
        await setIndex(env.GARAGEN_KV, ids.filter((i) => i !== id));
        // Clean up associated credential
        const credId = await env.GARAGEN_KV.get(`credentialRef:${id}`);
        if (credId) {
          await env.GARAGEN_KV.delete(`credential:${credId}`);
          await env.GARAGEN_KV.delete(`credentialRef:${id}`);
        }
        return jsonResponse({ success: true });
      }
    }

    // ── POST /api/stands/:id/webauthn/register ────────────────────────────────
    const registerMatch = pathname.match(/^\/api\/stands\/([^/]+)\/webauthn\/register$/);
    if (registerMatch && method === "POST") {
      const id = registerMatch[1];
      const stand = await getStand(env.GARAGEN_KV, id);
      if (!stand) return errResponse("Not found", 404);

      let body: {
        editSecret?: string;
        challengeId?: string;
        credentialId?: string;
        publicKey?: string;    // base64url SPKI
        clientDataJSON?: string;
      };
      try { body = (await request.json()) as typeof body; }
      catch { return errResponse("Invalid JSON"); }

      if (body.editSecret !== stand.editSecret) return errResponse("Forbidden", 403);
      if (!body.challengeId || !body.credentialId || !body.publicKey || !body.clientDataJSON) {
        return errResponse("Missing fields");
      }

      // Verify the challenge
      const stored = await env.GARAGEN_KV.get<Challenge>(
        `challenge:${body.challengeId}`, "json"
      );
      if (!stored || stored.expiresAt < Date.now()) return errResponse("Challenge expired", 400);

      const clientData = JSON.parse(
        new TextDecoder().decode(b64urlDecode(body.clientDataJSON))
      ) as { type: string; challenge: string; origin: string };

      if (clientData.type !== "webauthn.create") return errResponse("invalid type");
      if (clientData.challenge !== stored.challenge) return errResponse("challenge mismatch");
      if (allowedOrigins && !allowedOrigins.includes(clientData.origin)) {
        return errResponse(`origin not allowed: ${clientData.origin}`);
      }

      // Store the credential
      const credential: StoredCredential = { standId: id, publicKey: body.publicKey };
      await env.GARAGEN_KV.put(`credential:${body.credentialId}`, JSON.stringify(credential));
      await env.GARAGEN_KV.put(`credentialRef:${id}`, body.credentialId);
      await env.GARAGEN_KV.delete(`challenge:${body.challengeId}`);

      return jsonResponse({ ok: true });
    }

    // ── POST /api/webauthn/challenge ──────────────────────────────────────────
    if (pathname === "/api/webauthn/challenge" && method === "POST") {
      const challengeBytes = crypto.getRandomValues(new Uint8Array(32));
      const challenge = b64urlEncode(challengeBytes.buffer);
      const challengeId = crypto.randomUUID();
      const entry: Challenge = { challenge, expiresAt: Date.now() + 5 * 60 * 1000 };
      // TTL 6 minutes in KV
      await env.GARAGEN_KV.put(`challenge:${challengeId}`, JSON.stringify(entry), {
        expirationTtl: 360,
      });
      return jsonResponse({ challengeId, challenge });
    }

    // ── POST /api/webauthn/authenticate ───────────────────────────────────────
    if (pathname === "/api/webauthn/authenticate" && method === "POST") {
      let body: {
        challengeId?: string;
        credentialId?: string;
        authenticatorData?: string;
        clientDataJSON?: string;
        signature?: string;
      };
      try { body = (await request.json()) as typeof body; }
      catch { return errResponse("Invalid JSON"); }

      if (!body.challengeId || !body.credentialId || !body.authenticatorData ||
          !body.clientDataJSON || !body.signature) {
        return errResponse("Missing fields");
      }

      // Look up stored challenge
      const stored = await env.GARAGEN_KV.get<Challenge>(
        `challenge:${body.challengeId}`, "json"
      );
      if (!stored || stored.expiresAt < Date.now()) return errResponse("Challenge expired", 400);

      // Look up credential
      const credential = await env.GARAGEN_KV.get<StoredCredential>(
        `credential:${body.credentialId}`, "json"
      );
      if (!credential) return errResponse("Credential not found", 404);

      // Verify assertion
      const result = await verifyWebAuthnAssertion(
        {
          credentialId: body.credentialId,
          authenticatorData: body.authenticatorData,
          clientDataJSON: body.clientDataJSON,
          signature: body.signature,
        },
        credential.publicKey,
        stored.challenge,
        allowedOrigins
      );
      if (result !== true) return errResponse(`Verification failed: ${result}`, 403);

      // Consume challenge
      await env.GARAGEN_KV.delete(`challenge:${body.challengeId}`);

      // Create session token (30 min TTL)
      const sessionToken = crypto.randomUUID();
      const session: Session = {
        standId: credential.standId,
        expiresAt: Date.now() + 30 * 60 * 1000,
      };
      await env.GARAGEN_KV.put(`session:${sessionToken}`, JSON.stringify(session), {
        expirationTtl: 1800,
      });

      return jsonResponse({ standId: credential.standId, sessionToken });
    }

    // ── Health check ──────────────────────────────────────────────────────────
    if (pathname === "/api/health" && method === "GET") {
      return jsonResponse({ status: "ok", ts: new Date().toISOString() });
    }

    return errResponse("Not found", 404);
  },
} satisfies ExportedHandler<Env>;
