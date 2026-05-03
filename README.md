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

### Traefik + HTTPS (optional)

Traefik is under profile `traefik`.

1. Set `APP_DOMAIN` and `LETSENCRYPT_EMAIL` in project root `.env` (or export in shell).
2. Run:
   - `docker compose --profile traefik up --build -d`
3. Traefik dashboard:
   - `http://localhost:8080`

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
