/**
 * Garagen-Flohmarkt Zirndorf – Cloudflare Worker
 *
 * API routes:
 *   GET    /api/stands          → list all registered stands
 *   POST   /api/stands          → register a new stand
 *   GET    /api/stands/:id      → get one stand
 *   PUT    /api/stands/:id      → update a stand
 *   DELETE /api/stands/:id      → delete a stand
 *
 * KV layout:
 *   "stands:index"   → JSON string[]   (ordered list of IDs)
 *   "stand:{id}"     → JSON Stand      (individual record)
 */

export interface Env {
  GARAGEN_KV: KVNamespace;
  /** Optional: set to restrict POST/PUT/DELETE to an admin token */
  ADMIN_TOKEN?: string;
}

interface Stand {
  id: string;
  name: string;
  address: string;
  plz: string;
  email: string;
  desc: string;
  categories: string[];
  time_from: string;
  time_to: string;
  district: string;
  /** Coordinates – populated later by admin / geocoding */
  lat?: number;
  lng?: number;
  open: boolean;
  /** false until an admin approves the entry */
  approved: boolean;
  createdAt: string;
}

// ── CORS ────────────────────────────────────────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function cors(res: Response): Response {
  const out = new Response(res.body, res);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => out.headers.set(k, v));
  return out;
}

function json(data: unknown, status = 200): Response {
  return cors(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}

// ── KV helpers ───────────────────────────────────────────────────────────────

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

// ── Validation ───────────────────────────────────────────────────────────────

const ALLOWED_CATEGORIES = [
  "Kindersachen", "Buecher", "Moebel", "Vintage", "Kleidung",
  "Haushalt", "Spielzeug", "Garten", "Werkzeug", "Elektronik", "Medien",
];

function validateStand(body: Partial<Stand>): string | null {
  if (!body.name?.trim()) return "name is required";
  if (!body.address?.trim()) return "address is required";
  if (body.categories) {
    const invalid = (body.categories as string[]).filter(
      (c) => !ALLOWED_CATEGORIES.includes(c)
    );
    if (invalid.length > 0) return `unknown categories: ${invalid.join(", ")}`;
  }
  return null;
}

// ── Auth (optional) ──────────────────────────────────────────────────────────

function isAuthorized(request: Request, env: Env): boolean {
  if (!env.ADMIN_TOKEN) return true; // no token configured → open
  const header = request.headers.get("Authorization") ?? "";
  return header === `Bearer ${env.ADMIN_TOKEN}`;
}

// ── Worker entry point ───────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();

    // Preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ── GET /api/stands ──────────────────────────────────────────────────────
    if (pathname === "/api/stands" && method === "GET") {
      const ids = await getIndex(env.GARAGEN_KV);
      const stands = (
        await Promise.all(ids.map((id) => getStand(env.GARAGEN_KV, id)))
      ).filter((s): s is Stand => s !== null);
      return json(stands);
    }

    // ── POST /api/stands ─────────────────────────────────────────────────────
    if (pathname === "/api/stands" && method === "POST") {
      let body: Partial<Stand>;
      try {
        body = (await request.json()) as Partial<Stand>;
      } catch {
        return err("Invalid JSON");
      }

      const validationError = validateStand(body);
      if (validationError) return err(validationError);

      const id = crypto.randomUUID();
      const stand: Stand = {
        id,
        name: body.name!.trim(),
        address: body.address!.trim(),
        plz: body.plz?.trim() || "90513",
        email: body.email?.trim() || "",
        desc: body.desc?.trim() || "",
        categories: body.categories || [],
        time_from: body.time_from || "10:00",
        time_to: body.time_to || "16:00",
        district: body.district || "Kernstadt",
        lat: body.lat,
        lng: body.lng,
        open: true,
        approved: false,
        createdAt: new Date().toISOString(),
      };

      await env.GARAGEN_KV.put(`stand:${id}`, JSON.stringify(stand));
      const ids = await getIndex(env.GARAGEN_KV);
      await setIndex(env.GARAGEN_KV, [...ids, id]);

      return json(stand, 201);
    }

    // ── /api/stands/:id ──────────────────────────────────────────────────────
    const idMatch = pathname.match(/^\/api\/stands\/([^/]+)$/);
    if (idMatch) {
      const id = idMatch[1];

      // GET /api/stands/:id
      if (method === "GET") {
        const stand = await getStand(env.GARAGEN_KV, id);
        if (!stand) return err("Not found", 404);
        return json(stand);
      }

      // PUT /api/stands/:id  (admin only if token configured)
      if (method === "PUT") {
        if (!isAuthorized(request, env)) return err("Unauthorized", 401);

        const existing = await getStand(env.GARAGEN_KV, id);
        if (!existing) return err("Not found", 404);

        let body: Partial<Stand>;
        try {
          body = (await request.json()) as Partial<Stand>;
        } catch {
          return err("Invalid JSON");
        }

        const updated: Stand = {
          ...existing,
          ...body,
          // Never allow overwriting the id or createdAt via PUT
          id,
          createdAt: existing.createdAt,
        };

        await env.GARAGEN_KV.put(`stand:${id}`, JSON.stringify(updated));
        return json(updated);
      }

      // DELETE /api/stands/:id  (admin only if token configured)
      if (method === "DELETE") {
        if (!isAuthorized(request, env)) return err("Unauthorized", 401);

        const existing = await getStand(env.GARAGEN_KV, id);
        if (!existing) return err("Not found", 404);

        await env.GARAGEN_KV.delete(`stand:${id}`);
        const ids = await getIndex(env.GARAGEN_KV);
        await setIndex(env.GARAGEN_KV, ids.filter((i) => i !== id));

        return json({ success: true });
      }
    }

    // ── Health check ─────────────────────────────────────────────────────────
    if (pathname === "/api/health" && method === "GET") {
      return json({ status: "ok", ts: new Date().toISOString() });
    }

    return err("Not found", 404);
  },
} satisfies ExportedHandler<Env>;
