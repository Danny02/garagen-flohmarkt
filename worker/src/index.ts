/**
 * Garagen-Flohmarkt Zirndorf – Cloudflare Worker
 */

import { isAuthorized } from "./auth";
import { b64urlEncode, b64urlDecode } from "./base64url";
import { CORS, errResponse, jsonResponse } from "./http";
import { listStandIds, getStand, toPublic } from "./kv";
import type { Challenge, Env, Session, Stand, StoredCredential } from "./types";
import { validateStand } from "./validation";
import { verifyWebAuthnAssertion } from "./webauthn";

type GeocodeHit = { lat: string; lon: string };

const GEOCODER_USER_AGENT = "garagen-flohmarkt-worker/1.0 (+https://garagen-flohmarkt.pages.dev)";

async function fetchGeocodeHit(endpoint: URL, source: string): Promise<GeocodeHit | null> {
  console.log("[geocode] request", { source, url: endpoint.toString() });
  const response = await fetch(endpoint.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "de,en;q=0.8",
      "User-Agent": GEOCODER_USER_AGENT,
    },
  });
  if (!response.ok) {
    console.log("[geocode] upstream non-ok", {
      source,
      status: response.status,
      statusText: response.statusText,
    });
    return null;
  }

  const hits = (await response.json()) as GeocodeHit[];
  if (!Array.isArray(hits) || hits.length === 0) {
    console.log("[geocode] no hits", { source });
    return null;
  }

  console.log("[geocode] hit", {
    source,
    lat: hits[0].lat,
    lon: hits[0].lon,
  });
  return hits[0];
}

async function geocodeStandAddress(address: string, plz: string, district: string): Promise<{ lat: number; lng: number } | null> {
  const structured = new URL("https://nominatim.openstreetmap.org/search");
  structured.searchParams.set("format", "jsonv2");
  structured.searchParams.set("limit", "1");
  structured.searchParams.set("countrycodes", "de");
  structured.searchParams.set("street", address);
  structured.searchParams.set("postalcode", plz);
  structured.searchParams.set("city", "Zirndorf");
  structured.searchParams.set("state", "Bayern");

  const fallback = new URL("https://nominatim.openstreetmap.org/search");
  fallback.searchParams.set("format", "jsonv2");
  fallback.searchParams.set("limit", "1");
  fallback.searchParams.set("countrycodes", "de");
  fallback.searchParams.set("q", [address, `${plz} Zirndorf`, district, "Germany"].filter(Boolean).join(", "));

  const broadFallback = new URL("https://nominatim.openstreetmap.org/search");
  broadFallback.searchParams.set("format", "jsonv2");
  broadFallback.searchParams.set("limit", "1");
  broadFallback.searchParams.set("countrycodes", "de");
  broadFallback.searchParams.set("q", [address, `${plz} Zirndorf`, "Germany"].join(", "));

  try {
    console.log("[geocode] start", { address, plz, district });
    const hit =
      (await fetchGeocodeHit(structured, "structured")) ??
      (await fetchGeocodeHit(fallback, "fallback")) ??
      (await fetchGeocodeHit(broadFallback, "broad_fallback"));
    if (!hit) {
      console.log("[geocode] no result", { address, plz, district });
      return null;
    }

    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      console.log("[geocode] invalid coordinates", { lat: hit.lat, lon: hit.lon });
      return null;
    }

    console.log("[geocode] resolved", { lat, lng });
    return { lat, lng };
  } catch (error) {
    console.log("[geocode] request failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
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
      const ids = await listStandIds(env.GARAGEN_KV);
      const stands = (
        await Promise.all(ids.map((id) => getStand(env.GARAGEN_KV, id)))
      ).filter((s): s is Stand => s !== null);
      return jsonResponse(stands.map(toPublic));
    }

    // ── POST /api/stands ──────────────────────────────────────────────────────
    if (pathname === "/api/stands" && method === "POST") {
      let body: Partial<Stand> & { editSecret?: string };
      try { body = (await request.json()) as Partial<Stand>; }
      catch { return errResponse("Invalid JSON"); }

      const ve = validateStand(body);
      if (ve) return errResponse(ve);

      const address = body.address!.trim();
      const plz = body.plz?.trim() || "90513";
      const district = body.district?.trim() || "Kernstadt";

      let lat = body.lat;
      let lng = body.lng;
      if (lat == null || lng == null) {
        const geocoded = await geocodeStandAddress(address, plz, district);
        if (geocoded) {
          lat = geocoded.lat;
          lng = geocoded.lng;
        }
      }

      const id = crypto.randomUUID();
      const providedEditSecret = typeof body.editSecret === "string" ? body.editSecret.trim() : "";
      const editSecret = providedEditSecret || crypto.randomUUID();
      const stand: Stand = {
        id,
        label: body.label?.trim() || undefined,
        address,
        plz,
        district,
        desc: body.desc?.trim() || "",
        categories: body.categories || [],
        time_from: body.time_from || "10:00",
        time_to: body.time_to || "16:00",
        lat,
        lng,
        open: true,
        approved: false,
        createdAt: new Date().toISOString(),
        editSecret,
      };

      await env.GARAGEN_KV.put(`stand:${id}`, JSON.stringify(stand));

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

        const nextAddress = body.address?.trim() || existing.address;
        const nextPlz = body.plz?.trim() || existing.plz;
        const nextDistrict = body.district?.trim() || existing.district;

        let lat = body.lat ?? existing.lat;
        let lng = body.lng ?? existing.lng;

        const locationChanged =
          nextAddress !== existing.address ||
          nextPlz !== existing.plz ||
          nextDistrict !== existing.district;

        if (locationChanged && (body.lat == null || body.lng == null)) {
          const geocoded = await geocodeStandAddress(nextAddress, nextPlz, nextDistrict);
          if (geocoded) {
            lat = geocoded.lat;
            lng = geocoded.lng;
          }
        }

        const updated: Stand = {
          ...existing,
          label: body.label?.trim() ?? existing.label,
          address: nextAddress,
          plz: nextPlz,
          district: nextDistrict,
          desc: body.desc?.trim() ?? existing.desc,
          categories: body.categories || existing.categories,
          time_from: body.time_from || existing.time_from,
          time_to: body.time_to || existing.time_to,
          lat,
          lng,
          // immutable
          id, editSecret: existing.editSecret, createdAt: existing.createdAt,
          approved: existing.approved,
        };
        await env.GARAGEN_KV.put(`stand:${id}`, JSON.stringify(updated));
        return jsonResponse(toPublic(updated));
      }

      if (method === "DELETE") {
        const existing = await getStand(env.GARAGEN_KV, id);
        if (!existing) return jsonResponse({ success: true });
        let body: { editSecret?: string; sessionToken?: string };
        try { body = (await request.json()) as typeof body; }
        catch { return errResponse("Invalid JSON"); }
        if (!(await isAuthorized(body as Record<string, unknown>, existing, env.GARAGEN_KV))) {
          return errResponse("Forbidden", 403);
        }
        await env.GARAGEN_KV.delete(`stand:${id}`);
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
        algorithm?: number;
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
      const credential: StoredCredential = {
        userToken: stand.editSecret,
        publicKey: body.publicKey,
        alg: typeof body.algorithm === "number" ? body.algorithm : undefined,
      };
      const existingCredentialId = await env.GARAGEN_KV.get(`credentialRef:${stand.editSecret}`);
      if (existingCredentialId && existingCredentialId !== body.credentialId) {
        await env.GARAGEN_KV.delete(`credential:${existingCredentialId}`);
      }
      await env.GARAGEN_KV.put(`credential:${body.credentialId}`, JSON.stringify(credential));
      await env.GARAGEN_KV.put(`credentialRef:${stand.editSecret}`, body.credentialId);
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
        credential.alg,
        stored.challenge,
        allowedOrigins
      );
      if (result !== true) return errResponse(`Verification failed: ${result}`, 403);

      // Consume challenge
      await env.GARAGEN_KV.delete(`challenge:${body.challengeId}`);

      // Create session token (30 min TTL)
      const sessionToken = crypto.randomUUID();
      const sessionUserToken = credential.userToken || "";
      if (!sessionUserToken && !credential.standId) {
        return errResponse("Credential is not linked to an owner", 500);
      }

      let resolvedUserToken = sessionUserToken;
      if (!resolvedUserToken && credential.standId) {
        const stand = await getStand(env.GARAGEN_KV, credential.standId);
        if (!stand) return errResponse("Credential owner not found", 404);
        resolvedUserToken = stand.editSecret;
      }

      const session: Session = {
        userToken: resolvedUserToken,
        standId: credential.standId,
        expiresAt: Date.now() + 30 * 60 * 1000,
      };
      await env.GARAGEN_KV.put(`session:${sessionToken}`, JSON.stringify(session), {
        expirationTtl: 1800,
      });

      return jsonResponse({
        sessionToken,
        credentialId: body.credentialId,
      });
    }

    // ── POST /api/my/stands ──────────────────────────────────────────────────
    if (pathname === "/api/my/stands" && method === "POST") {
      let body: { sessionToken?: string };
      try { body = (await request.json()) as typeof body; }
      catch { return errResponse("Invalid JSON"); }

      if (!body.sessionToken) return errResponse("Missing sessionToken");

      const session = await env.GARAGEN_KV.get<Session>(`session:${body.sessionToken}`, "json");
      if (!session || session.expiresAt <= Date.now()) return errResponse("Forbidden", 403);

      const ids = await listStandIds(env.GARAGEN_KV);
      const stands = (
        await Promise.all(ids.map((standId) => getStand(env.GARAGEN_KV, standId)))
      ).filter((s): s is Stand => s !== null);

      const owned = stands.filter((stand) => {
        if (session.userToken) return stand.editSecret === session.userToken;
        if (session.standId) return stand.id === session.standId;
        return false;
      });

      return jsonResponse(owned.map(toPublic));
    }

    // ── Health check ──────────────────────────────────────────────────────────
    if (pathname === "/api/health" && method === "GET") {
      return jsonResponse({ status: "ok", ts: new Date().toISOString() });
    }

    return errResponse("Not found", 404);
  },
} satisfies ExportedHandler<Env>;
