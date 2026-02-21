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

### 1 – Worker (runs on port 8787)

```bash
cd worker
npm install
# first time only – create a KV namespace:
npm run kv:create
npm run kv:create:preview
# paste the IDs into wrangler.toml, then:
npm run dev
```

### 2 – Frontend (runs on port 5173, proxies /api → 8787)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## API reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stands` | List all registered stands |
| POST | `/api/stands` | Register a new stand |
| GET | `/api/stands/:id` | Get one stand |
| PUT | `/api/stands/:id` | Update a stand (admin) |
| DELETE | `/api/stands/:id` | Delete a stand (admin) |
| GET | `/api/health` | Health check |

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
| `CLOUDFLARE_KV_NAMESPACE_ID` | KV namespace ID (production) |
| `CLOUDFLARE_KV_PREVIEW_ID` | KV namespace preview ID |
| `WORKER_URL` | Full Worker URL injected into the frontend build |

Push to `main` → CI builds → Worker deploys → Frontend deploys to Cloudflare Pages.
