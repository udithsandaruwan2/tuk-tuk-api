# Tuk-Tuk Tracking API

Layered REST API for Sri Lanka tuk-tuk tracking with JWT auth, role-based access, PostgreSQL, and Swagger docs.

## Stack

- Node.js + Express
- PostgreSQL + Prisma
- JWT + bcryptjs
- zod validation
- helmet/cors/hpp/rate-limit
- swagger-ui-express (OpenAPI spec in `src/config/swagger.js`)

## Run

1. Copy `.env.example` to `.env`
2. Install dependencies: `npm install`
3. Apply schema: `npm run prisma:push`
4. Generate seed files:
   - `npm run seed:master`
   - `npm run seed:sim`
5. Seed database: `npm run seed:db`
6. Start app:
   - `npm run dev`

## API

- Health: `GET /health`
- Swagger UI: `GET /docs`
- Base API: `/api`

## Docker

1. Copy env for the container:
   - `cp .env.docker.example .env.docker`
2. Set `DATABASE_URL` (e.g. Neon), `JWT_SECRET`, and any other values in `.env.docker`.
3. Run the API (default — **no Traefik**):
   - Foreground (logs in terminal): `docker compose up --build`
   - **Background:** `docker compose up --build -d` — then `docker compose logs -f` to tail logs, `docker compose down` to stop.
4. Open **`http://localhost:8000`** (health: `/health`, docs: `/docs`, API: `/api`).

### Traefik + HTTPS (optional)

Traefik is behind a Compose **profile** so a missing `APP_DOMAIN` does not break local runs.

1. Put **`APP_DOMAIN`** and **`LETSENCRYPT_EMAIL`** in a project-root **`.env`** file (Compose reads this for variable substitution in `docker-compose.yml`), or export them in your shell.
2. Start: `docker compose --profile traefik up --build`
3. Traefik dashboard (insecure API): `http://localhost:8080`  
   The app router uses HTTPS on port **443** for `${APP_DOMAIN}` (DNS must point at this host for Let’s Encrypt to work).

## Default Seed Users

All use password: `Password123!`

- `hq.admin@example.com` (HQ_ADMIN)
- `prov.admin@example.com` (PROVINCIAL_ADMIN)
- `station.user@example.com` (STATION_USER)
- `device.client@example.com` (DEVICE_CLIENT)
