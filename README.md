# Garagenflohmarkt Zirndorf

Mobile-first web app for the Zirndorf neighbourhood garage-sale event.
Built with React + Vite (frontend) and a Cloudflare Worker + KV (backend).

## Project structure

```
garagen-flohmarkt/
├── frontend/          # React / Vite app
│   └── src/App.jsx    # main prototype (all screens)
├── worker/            # Cloudflare Worker (TypeScript)
│   ├── src/index.ts   # REST API + KV logic
│   └── wrangler.toml  # Worker config
└── .github/workflows/
    ├── ci.yml         # build + typecheck on every PR
    └── deploy.yml     # deploy Worker + Pages on push to main
```

## Local development

### 1 – Frontend only (runs on port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### 2 – Full app locally (Frontend + Worker)

```bash
cd worker
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Deployment setup (one-time)

Create the production KV namespace once:

```bash
cd worker
npm install
npm run kv:create
```

Copy the returned namespace ID to:
- `worker/wrangler.toml` (`id = "REPLACE_WITH_KV_NAMESPACE_ID"`) for manual deploys
- GitHub secret `CLOUDFLARE_KV_NAMESPACE_ID` for CI deploys

## API reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stands` | List all registered stands |
| POST | `/api/stands` | Register a new stand |
| GET | `/api/stands/:id` | Get one stand |
| PUT | `/api/stands/:id` | Update a stand (admin) |
| DELETE | `/api/stands/:id` | Delete a stand (admin) |
| GET | `/api/health` | Health check |

## Configuration

- Frontend app content/config is centralized in `frontend/src/appConfig.js` (categories, districts, event details, info page content, registration defaults).
- Frontend derived constants remain available in `frontend/src/constants.js`.
- Worker category validation uses `worker/src/config.ts`.

### Optional GoatCounter analytics

Set this frontend env var to enable GoatCounter:

```bash
VITE_GOATCOUNTER_ENDPOINT=https://YOUR-CODE.goatcounter.com/count
```

Create `frontend/.env.local` for local use or configure the same variable in your deployment environment.

### Optional admin token

```bash
wrangler secret put ADMIN_TOKEN
```

Set the `Authorization: Bearer <token>` header for `PUT` / `DELETE` requests.

## Deployment (GitHub Actions)

Add these secrets in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | CF API token (Workers + Pages + KV Edit) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `CLOUDFLARE_KV_NAMESPACE_ID` | KV namespace ID created by `npm run kv:create` |
| `WORKER_URL` | Full Worker URL injected into the frontend build |

Push to `main` → CI builds → Worker deploys → Frontend deploys to Cloudflare Pages.
