# Tuk-Tuk Tracking API

Layered REST API for Sri Lanka tuk-tuk tracking with JWT auth, RBAC, PostgreSQL, and Swagger docs.

## Student Information

- NIBM Index: `COBSCCOMP242P-027`

## Stack

- Node.js + Express 5
- PostgreSQL + Prisma
- JWT + bcryptjs
- zod validation
- helmet / cors / hpp / rate-limit
- swagger-ui-express (OpenAPI)

## Quick Start (Normal Run)

1. Copy environment template:
   - `cp .env.example .env`
2. Install dependencies:
   - `npm install`
3. Generate Prisma client and push schema:
   - `npm run prisma:generate`
   - `npm run prisma:push`
4. (Optional) Generate and seed sample data:
   - `npm run seed:master`
   - `npm run seed:sim`
   - `npm run seed:db`
5. Start API:
   - Dev: `npm run dev`
   - Prod style: `npm start`

Default URL: `http://localhost:8000`

## Production API (HTTPS)

**Public base URL:** `https://api.udithsandaruwan.com/`

| Check | Action |
|--------|--------|
| DNS | **A** record `api.udithsandaruwan.com` → your server public IPv4 (or correct target for your hoster). |
| Firewall | Inbound **TCP 80** and **TCP 443** open on the server. |
| Compose env | `cp compose.env.example .env` → set real `LETSENCRYPT_EMAIL`. |
| App container | `cp .env.docker.example .env.docker` → set `DATABASE_URL`, `JWT_SECRET`, etc. |
| Start | `docker compose --profile traefik up --build -d` |
| Verify | `https://api.udithsandaruwan.com/health` → `200` JSON |

### Cloudflare (important)

Cloudflare HTTPS at the edge is **not** enough unless your **origin** also serves HTTPS. Traefik + Let’s Encrypt on your VM satisfies that.

1. **SSL/TLS → Overview:** set encryption mode to **Full (strict)** (not *Flexible*).  
2. **Edge certificate** can stay on Cloudflare; **origin** uses the Let’s Encrypt cert Traefik obtains.  
3. If HTTP-01 issuance ever fails while the hostname is **proxied** (orange cloud), temporarily set the record to **DNS only** (grey cloud), wait for Traefik to obtain `acme.json`, then turn proxy back on — or use DNS-01 / Cloudflare Origin Cert (advanced).

## API Docs

- Swagger UI: `GET /docs` (alias: `/api-docs`)
- OpenAPI JSON: `GET /openapi.json`
- Downloadable Swagger JSON: `GET /downloads/swagger.json`
- Downloadable sample JSON:
  - `GET /downloads/master-data.json`
  - `GET /downloads/sim-seed-sample.json`

## Auth

1. Login:
   - `POST /api/auth/login`
2. Use returned token in header:
   - `Authorization: Bearer <token>`

Default seed users (password: `Password123!`):

- `hq.admin@example.com` (`HQ_ADMIN`)
- `prov.admin@example.com` (`PROVINCIAL_ADMIN`)
- `station.user@example.com` (`STATION_USER`)
- `device.client@example.com` (`DEVICE_CLIENT`)

## Docker

### API only (recommended local)

- Foreground: `docker compose up --build`
- Background: `docker compose up --build -d`
- Logs: `docker compose logs -f`
- Stop: `docker compose down`

App URL: `http://localhost:8000`

### Traefik + HTTPS (same layout as common “Django + Traefik” tutorials)

Traefik runs only with Compose profile **`traefik`**. Implemented behaviour:

| Step | This project |
|------|----------------|
| HTTP + HTTPS entrypoints | `web` **:80**, `websecure` **:443** |
| Force HTTP → HTTPS | `web` redirects to `websecure` with `scheme=https` |
| TLS on the API route | Router `app`: `Host(...)`, `entrypoints=websecure`, `tls=true`, `certresolver=letsencrypt` |
| Expose ports | **80**, **443**, **8080** (Traefik dashboard) |
| ACME storage | Docker volume **`letsencrypt_data`** → `/letsencrypt/acme.json` |

**Project `.env` (Compose / Traefik only)** — copy template:

```bash
cp compose.env.example .env
```

Defaults target **`api.udithsandaruwan.com`**. Override `APP_DOMAIN` only if you use another hostname.

**Container `.env.docker` (Node app)** — copy and fill secrets:

```bash
cp .env.docker.example .env.docker
```

Must include **`TRUST_PROXY=true`**, **`PUBLIC_BASE_URL=https://api.udithsandaruwan.com`**, and **`ALLOWED_ORIGINS`** matching that origin so CORS and Swagger work over HTTPS.

**Start**

```bash
docker compose --profile traefik up --build -d
```

**URLs**

- **Production API:** `https://api.udithsandaruwan.com/` (health: `/health`, docs: `/docs`, OpenAPI: `/openapi.json`)
- Traefik dashboard (dev): `http://localhost:8080` (bind to localhost in production or disable)
- Direct Node port (debug only): `http://localhost:8000`

**Optional:** bind-mount `./letsencrypt:/letsencrypt` instead of the named volume if you want cert files on disk.

### GitHub Actions → EC2

Add the repository secrets listed in **`GITHUB_SECRETS.md`** (SSH host/user/key, `DATABASE_URL`, `JWT_SECRET`, `APP_DOMAIN`, `LETSENCRYPT_EMAIL`, `ALLOWED_ORIGINS`, etc.). Push to **`main`** runs lint/tests then deploys with **`docker compose --profile traefik`**.

## Scripts

- `npm run dev` - start with watch
- `npm start` - start server
- `npm test` - run tests
- `npm run lint` - lint code
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:push` - push schema to DB
- `npm run seed:master` - generate master data JSON
- `npm run seed:sim` - generate simulation JSON
- `npm run seed:db` - seed PostgreSQL

## Project Notes

- API includes full CRUD/list flows for provinces, districts, stations, users, vehicles, and location pings.
- Role and scope checks are enforced with middleware and service-level constraints.
- History endpoint enforces bounded query window for performance and safety.
