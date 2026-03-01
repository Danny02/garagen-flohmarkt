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

### Frontend UI tests (Playwright)

```bash
cd frontend
npm install
npm run e2e:install
npm run e2e
```

Useful variants:

```bash
npm run e2e:ui
npm run e2e:headed
npm run e2e:debug
```

Notes:
- E2E specs live in `frontend/e2e` and use mocked `/api/*` responses for stable UI flows.
- Reports and artifacts are generated under `frontend/playwright-report` and `frontend/test-results` (gitignored).

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
- `worker/wrangler.toml` in `[[env.production.kv_namespaces]]`

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
| `WORKER_URL` | Full Worker URL injected into the frontend build |

Push to `main` → CI builds → Worker deploys → Frontend deploys to Cloudflare Pages.

## License

This project is licensed under **GNU Affero General Public License v3.0 or later**.

- SPDX identifier: `AGPL-3.0-or-later`
- Full license text: [LICENSE](LICENSE)
- Commercial services (e.g., hosting, setup, maintenance, support contracts) are allowed.
- If you run a modified version for users over a network, you must provide the corresponding source code of that modified version under AGPL terms.

Contributions are welcome and are accepted under the same AGPL-3.0-or-later license.
