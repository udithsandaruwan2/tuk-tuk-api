# Tuk-Tuk Tracking API — Technical & Project Report

**Purpose of this document:** Use it as the single source of truth when writing submissions, lecturer reports, handover notes, or architecture briefs. Fill placeholders marked `<…>` (repository URL, deployment host, student IDs) before final submission.

**Related files:** `README.md` (quick start), `.env.example` / `.env.docker.example` (configuration templates), `docker-compose.yml`, `prisma/schema.prisma`, `src/config/openapiPaths.js` (API catalog for Swagger).

---

## Table of contents

1. [Executive summary](#1-executive-summary)  
2. [Business requirements](#2-business-requirements-analysis)  
3. [Technology stack](#3-technology-stack)  
4. [System architecture](#4-system-architecture)  
5. [Data model](#5-data-model-postgresql--prisma)  
6. [REST API catalog](#6-rest-api-catalog)  
7. [Authentication, RBAC, and scoping](#7-authentication-rbac-and-scoping)  
8. [Validation, rate limiting, and errors](#8-validation-rate-limiting-and-errors)  
9. [API documentation (OpenAPI / Swagger)](#9-api-documentation-openapi--swagger)  
10. [Local development](#10-local-development)  
11. [Docker and Traefik](#11-docker-and-traefik)  
12. [CI/CD and deployment](#12-cicd-and-deployment)  
13. [Simulation data and seeding](#13-simulation-data-and-seeding)  
14. [Testing](#14-testing)  
15. [Security posture (OWASP-aligned)](#15-security-posture-owasp-aligned)  
16. [Limitations, scaling, and roadmap](#16-limitations-scaling-and-roadmap)  
17. [Privacy, ethics, and compliance](#17-privacy-ethics-and-compliance)  
18. [Appendices](#18-appendices)

---

## 1. Executive summary

This project delivers a **production-style REST API** for tracking registered three-wheeler (“tuk-tuk”) style vehicles used in a **Sri Lanka police / operations** context. The backend provides:

- **JWT authentication** and **role-based access control (RBAC)** across HQ, provincial, station, and device roles.
- **CRUD and list APIs** for administrative geography (provinces, districts, stations), **users**, **vehicles**, and **location pings**, plus **live** and **bounded history** reads.
- **PostgreSQL** via **Prisma ORM**, suitable for **Neon** or any standard Postgres.
- **OpenAPI 3** documentation served by **Swagger UI** (`/docs`, `/api-docs`) and JSON (`/openapi.json`).
- **Docker** packaging, optional **Traefik** reverse proxy with **Let’s Encrypt**, and **GitHub Actions** deployment to **EC2**.

The system is **stateless at the HTTP layer**, designed for horizontal scaling behind a reverse proxy, with the database as the primary shared state.

---

## 2. Business requirements analysis

### 2.1 Problem context and operational need

Urban and semi-urban law enforcement operations benefit from continuous visibility over registered public transport movement for safety monitoring, incident response, and jurisdictional accountability. Tuk-tuks are modeled as **monitored mobile assets** that submit **location pings** to a centralized platform. Without centralized tracking, authorities rely on fragmented reports, which weakens early detection of suspicious movement and complicates inter-district coordination.

The core business requirement is a **secure backend API** that supports:

- Near **real-time monitoring** of active vehicles (pull-based “live” endpoint).
- **Historical movement** retrieval for investigations, with **time-bounded** queries.
- **Geographic filtering** by province and district where applicable.
- **Role-based operational boundaries** (HQ vs provincial vs station vs device).

This backend is a **service layer** for future dashboards, mobile apps, and analytics.

### 2.2 Stakeholders

| Stakeholder | Need |
|-------------|------|
| **HQ administrators** | National visibility, cross-boundary search, master data and vehicle/user management. |
| **Provincial / station users** | Scoped visibility to assigned jurisdiction (least privilege). |
| **Device clients** | Authenticated ingestion of pings for an assigned vehicle. |
| **Platform maintainers / evaluators** | Documented API, health checks, reproducible seeds, deployability. |

### 2.3 In-scope capabilities

- Secure authentication and authorization.
- Role-aware data access and list filtering.
- Master data APIs: provinces, districts, stations (list, get, create, update, delete as per role rules).
- Vehicle lifecycle APIs (list, search, get, create, update, delete).
- User management (HQ).
- Device ping ingestion; ping list/get/update/delete (HQ for mutating ping operations).
- Live location snapshot; vehicle history with **maximum 7-day** window.
- OpenAPI/Swagger documentation.
- Containerized runtime; optional HTTPS edge; CI/CD to EC2.

### 2.4 Out of scope

- End-user mobile/web UI (beyond Swagger).
- Firmware for GPS hardware; real-world telematics certification.
- Real-time push (WebSockets/SSE) to operator consoles.
- Command-center visualization and case-management workflows.

### 2.5 Non-functional requirements (summary)

| Concern | Approach |
|---------|----------|
| **Security** | JWT, bcrypt, helmet, CORS allowlist, HPP, validation, rate limit on ping POST, structured errors. |
| **Performance** | Pagination; indexed `(vehicleId, timestamp DESC)` for pings; bounded history window. |
| **Scalability** | Stateless API; managed Postgres (e.g. Neon); clear layering for future queues/read replicas. |
| **Operability** | `/health`, `/`, Docker, optional Traefik, GitHub Actions deploy script. |

---

## 3. Technology stack

| Layer | Technology |
|-------|------------|
| Runtime | **Node.js 20+** (ES modules) |
| HTTP | **Express 5** |
| ORM / DB | **Prisma 6** + **PostgreSQL** |
| Auth | **jsonwebtoken**, **bcryptjs** |
| Validation | **zod** |
| Hardening | **helmet**, **cors**, **hpp**, **express-rate-limit** |
| API docs | **swagger-ui-express**, hand-maintained **OpenAPI 3.0.3** in `src/config/` |
| Container | **Docker** (`node:20-slim` + OpenSSL for Prisma) |
| Edge (optional) | **Traefik v2.11**, Let’s Encrypt HTTP-01 |
| CI/CD | **GitHub Actions**, **appleboy/ssh-action** for EC2 |

---

## 4. System architecture

### 4.1 Layered application structure

```
Client / Device
      │
      ▼
┌─────────────────────────────────────────┐
│  Express app (src/app.js)               │
│  • Security middleware (helmet, cors…)   │
│  • JSON body parser                      │
│  • Rate limit (ping route)               │
│  • Routes → controllers → services       │
│  • Central error + 404 handlers          │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│  PostgreSQL (Neon or self-hosted)       │
│  • Prisma Client                         │
└─────────────────────────────────────────┘
```

**Code layout (conceptual):**

| Area | Responsibility |
|------|------------------|
| `src/routes/*.js` | Mount paths, compose middleware (`authenticate`, `authorizeRoles`, `validate`, `asyncHandler`). |
| `src/controllers/*.js` | Map HTTP to service calls; shape JSON responses. |
| `src/services/*.js` | Business rules, Prisma queries, scope checks. |
| `src/middleware/` | Auth, validation, errors, 404. |
| `src/validators/` | zod schemas for body/query/params. |
| `src/config/` | DB, Swagger/OpenAPI assembly, path enrichment. |

### 4.2 Request lifecycle (protected route)

1. **Helmet / CORS / HPP / JSON** apply globally.  
2. **`authenticate`** verifies JWT and attaches `req.user`.  
3. **`authorizeRoles`** ensures role is allowed for the route class.  
4. **`validate`** parses and attaches `req.validated` (Express 5–safe; avoids mutating `req.query` in ways that break).  
5. **Controller** calls **service** with validated input and user context.  
6. **Service** enforces **object-level scope** (e.g. station user only sees own district/station slice).  
7. **Response** uses a consistent envelope: `{ success, message, data }` (where applicable).  
8. Errors flow to **`errorHandler`** for normalized status and body.

---

## 5. Data model (PostgreSQL + Prisma)

### 5.1 Entities

| Model | Description |
|-------|-------------|
| **Province** | Top-level region; `code` unique. |
| **District** | Belongs to `Province`; `code` unique; indexed on `provinceId`. |
| **PoliceStation** | Belongs to `District`; lat/lng; `code` unique. |
| **Vehicle** | `regNumber` and `deviceId` unique; optional `driverName`; `VehicleStatus`; optional `currentDistrictId`. |
| **LocationPing** | Belongs to `Vehicle`; `lat`, `lng`, optional `speed`/`heading`, `timestamp`; **`@@index([vehicleId, timestamp(sort: Desc)])`** for history. |
| **User** | `email` unique; `passwordHash`; `Role`; optional `stationId`, `provinceId`, `vehicleId` for scoping. |

### 5.2 Enumerations

- **`Role`:** `HQ_ADMIN`, `PROVINCIAL_ADMIN`, `STATION_USER`, `DEVICE_CLIENT`  
- **`VehicleStatus`:** `ACTIVE`, `INACTIVE`, `MAINTENANCE`

### 5.3 Indexing rationale

- **Pings:** composite index on `(vehicleId, timestamp DESC)` supports vehicle history and recent pings.  
- **Uniques:** prevent duplicate registrations and credential collision (`User.email`, `Vehicle.regNumber`, `Vehicle.deviceId`).  
- **Foreign keys:** cascade or set-null as defined in schema for referential integrity.

---

## 6. REST API catalog

Base path for business APIs: **`/api`**. Public system routes: **`/`**, **`/health`**.

> **Note:** Exact RBAC per row is enforced in code (services + middleware). The table summarizes the primary rule set; always confirm in `src/routes/*.js` and services if auditing for production.

### 6.1 Auth

| Method | Path | Auth | Summary |
|--------|------|------|---------|
| POST | `/api/auth/login` | Public | Email + password → JWT (`data.accessToken`). |

### 6.2 Master data — provinces

| Method | Path | Typical roles |
|--------|------|----------------|
| GET | `/api/provinces` | HQ, provincial, station (read) |
| GET | `/api/provinces/:id` | Same |
| POST | `/api/provinces` | HQ only |
| PATCH | `/api/provinces/:id` | HQ only |
| DELETE | `/api/provinces/:id` | HQ only |

### 6.3 Master data — districts

| Method | Path | Typical roles |
|--------|------|----------------|
| GET | `/api/districts` | Read roles (scoped filters may apply) |
| GET | `/api/districts/:id` | Read roles |
| POST | `/api/districts` | HQ only |
| PATCH | `/api/districts/:id` | HQ only |
| DELETE | `/api/districts/:id` | HQ only |

Query examples: `page`, `limit`, `provinceId`, `search` (see OpenAPI).

### 6.4 Master data — stations

| Method | Path | Typical roles |
|--------|------|----------------|
| GET | `/api/stations` | Read roles |
| GET | `/api/stations/:id` | Read roles |
| POST | `/api/stations` | HQ only |
| PATCH | `/api/stations/:id` | HQ only |
| DELETE | `/api/stations/:id` | HQ only |

### 6.5 Users (HQ)

| Method | Path | Typical roles |
|--------|------|----------------|
| GET | `/api/users` | HQ only |
| GET | `/api/users/:id` | HQ only |
| POST | `/api/users` | HQ only |
| PATCH | `/api/users/:id` | HQ only |
| DELETE | `/api/users/:id` | HQ only (cannot delete self) |

### 6.6 Vehicles

| Method | Path | Typical roles |
|--------|------|----------------|
| GET | `/api/vehicles` | HQ, provincial, station (list scoped for non-HQ) |
| GET | `/api/vehicles/:id` | Same |
| POST | `/api/vehicles` | HQ only |
| PATCH | `/api/vehicles/:id` | HQ only |
| DELETE | `/api/vehicles/:id` | HQ only |

### 6.7 Location

| Method | Path | Typical roles |
|--------|------|----------------|
| POST | `/api/location/ping` | **DEVICE_CLIENT** only (ingestion) |
| GET | `/api/location/pings` | HQ, provincial, station, device (read; scoped) |
| GET | `/api/location/pings/:id` | Same |
| PATCH | `/api/location/pings/:id` | **HQ only** |
| DELETE | `/api/location/pings/:id` | **HQ only** |
| GET | `/api/location/live` | Authenticated (query filters) |
| GET | `/api/location/history/:vehicleId` | Authenticated (scoped; **max 7 days**; `startDate` + `endDate` required) |

**Rate limiting:** `POST /api/location/ping` is limited (e.g. per-minute cap) via `express-rate-limit`.

### 6.8 System

| Method | Path | Auth |
|--------|------|------|
| GET | `/` | Public — API metadata and doc links |
| GET | `/health` | Public — liveness |

---

## 7. Authentication, RBAC, and scoping

### 7.1 Login and JWT

1. Client sends `POST /api/auth/login` with JSON `{ email, password }`.  
2. Server verifies password with **bcrypt** against `User.passwordHash`.  
3. On success, issues a **JWT** containing at least `sub` (user id), **role**, and scope fields (`provinceId`, `stationId`, `vehicleId`) when present.  
4. Protected routes expect header: **`Authorization: Bearer <token>`** (Swagger security scheme: `bearerAuth`).

**Expiry:** controlled by `JWT_EXPIRES_IN` (e.g. `1h`). Refresh tokens are **not** implemented in this version (see roadmap).

### 7.2 Middleware

- **`authenticate`:** Validates JWT, populates `req.user`.  
- **`authorizeRoles(...)`:** Ensures `req.user.role` is in the allowed set for the route.

### 7.3 Service-level scoping

Beyond route-level roles, **services** enforce **data scope** (e.g. provincial user limited to their province’s districts/stations/vehicles where applicable; device client limited to assigned vehicle for pings). This mitigates **IDOR**-style issues for list/get endpoints.

---

## 8. Validation, rate limiting, and errors

### 8.1 Validation (zod)

- **Body / query / params** validated via `src/middleware/validate.js`.  
- Parsed values exposed as **`req.validated`** to avoid unsafe reliance on raw `req.query` / `req.params` under Express 5.  
- Examples: pagination bounds, geo bounds, required date ranges for history, enums for roles and vehicle status.

### 8.2 Rate limiting

- **`/api/location/ping`:** dedicated limiter window (abuse / flood protection).

### 8.3 Errors

- **`ApiError`** for controlled HTTP statuses and messages.  
- **`errorHandler`** returns consistent JSON and avoids leaking stack traces in production.  
- **`notFoundHandler`** for unknown routes.

---

## 9. API documentation (OpenAPI / Swagger)

### 9.1 Endpoints for humans

| Resource | URL |
|----------|-----|
| Swagger UI (primary) | **`GET /docs`** (may redirect to `/docs/`) |
| Swagger UI (alias) | **`GET /api-docs`** |
| OpenAPI JSON | **`GET /openapi.json`**, also **`/docs/openapi.json`**, **`/api-docs/openapi.json`** |

### 9.2 Spec construction

- **Paths:** `src/config/openapiPaths.js` — every operational route is listed with tags, summaries, parameters, and request body examples.  
- **Assembly:** `src/config/swagger.js` — merges `info`, `components.schemas`, `servers`, and `paths`.  
- **Enrichment:** `src/config/openapiEnrich.js` —  
  - Sets **`security: []`** only for `GET /health`, `GET /`, `POST /api/auth/login`.  
  - Adds **`bearerAuth`** to all other operations if missing.  
  - Adds **`operationId`** values.  
  - Injects minimal **`schema`** for JSON bodies that only had `example` (better Swagger UX).  
- **`buildServers()`:** If **`PUBLIC_BASE_URL`** is set, the spec uses it as the server URL for “Try it out” behind proxies; otherwise **`/`** (same origin).

### 9.3 How to try the API in Swagger

1. Open `/docs` (or `/api-docs`).  
2. Execute **`POST /api/auth/login`** without Authorize.  
3. Copy **`data.accessToken`**.  
4. Click **Authorize**, paste **only the JWT** (no `Bearer ` prefix if the UI is configured that way — match project’s Swagger `bearerAuth` description).  
5. Call protected operations.

### 9.4 Helmet and Swagger

**Content Security Policy** is disabled for the whole app in current configuration so Swagger’s inline bootstrapping works. **`crossOriginEmbedderPolicy`** is disabled to reduce friction with Swagger assets. For stricter production hardening, consider serving docs on a separate subdomain or using a stricter CSP with nonces (future work).

---

## 10. Local development

1. **Clone** the repository (`<REPO_URL>`).  
2. **`cp .env.example .env`** and set `DATABASE_URL`, `JWT_SECRET`, etc.  
3. **`npm install`**  
4. **`npm run prisma:generate`** and **`npm run prisma:push`** (or migrations if you add them).  
5. **Generate and load seed data (optional demo):**  
   - `npm run seed:master`  
   - `npm run seed:sim`  
   - `npm run seed:db`  
6. **Run:** `npm run dev` (watch) or `npm start`.  
7. **Default port:** `PORT` (default **8000**).

**Default seed users** (password **`Password123!`** unless you change seeds):

- `hq.admin@example.com` — HQ_ADMIN  
- `prov.admin@example.com` — PROVINCIAL_ADMIN  
- `station.user@example.com` — STATION_USER  
- `device.client@example.com` — DEVICE_CLIENT  

---

## 11. Docker and Traefik

### 11.1 Dockerfile notes

- Base **`node:20-slim`**.  
- **OpenSSL** and **ca-certificates** are installed so **Prisma** can detect OpenSSL correctly (avoids runtime warnings and potential engine issues).

### 11.2 Default Compose (API only)

```bash
docker compose up --build -d
```

- Starts **`app`** only (Traefik is on a **profile**).  
- Published port **`8000:8000`** → **`http://localhost:8000`**.

**Foreground vs background:** `docker compose up` attaches to logs; **`docker compose up -d`** runs detached. Use **`docker compose logs -f`** to follow logs and **`docker compose down`** to stop.

### 11.3 Traefik profile (HTTPS)

```bash
docker compose --profile traefik up --build -d
```

**Important — Compose variable substitution:**

- Interpolation in `docker-compose.yml` (`labels`, Traefik `command`) uses the project **`.env`** file next to `docker-compose.yml`, **or** variables exported in the shell.  
- It does **not** read `env_file: .env.docker` for those interpolations.  
- Set **`APP_DOMAIN`** and **`LETSENCRYPT_EMAIL`** in a root **`.env`** (or export them) before enabling Traefik.  
- If `APP_DOMAIN` is unset, labels default to **`api.localhost`** so Traefik never receives an empty `Host()` rule.  
- **`LETSENCRYPT_EMAIL`:** default in compose avoids `@` inside `${VAR:-default}` because **`@` breaks Docker Compose interpolation**; a safe placeholder domain is used unless you set the variable.

**Let’s Encrypt** requires a **public DNS** name pointing to the host and reachable **HTTP-01** on port **80**.

### 11.4 Container environment

- **`env_file: .env.docker`** supplies runtime secrets to the Node process (`DATABASE_URL`, `JWT_SECRET`, etc.).  
- Keep **secrets out of Git**; use GitHub Secrets / server files in production.

---

## 12. CI/CD and deployment

### 12.1 GitHub Actions workflow (`.github/workflows/node-cicd.yml`)

**Trigger:** push to **`main`**.

**Stages:**

1. Checkout  
2. Node 20 + `npm ci`  
3. `npx prisma generate`  
4. **`npm run lint`**  
5. **`npm test`**  
6. **Deploy over SSH** to EC2: `git pull`, write **`.env.docker`**, export `APP_DOMAIN` / `LETSENCRYPT_EMAIL`, **`docker compose up -d --build --remove-orphans`**

**Secrets (typical):** `EC2_HOST`, `EC2_USER`, `EC2_KEY`, `PORT`, `NODE_ENV`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ALLOWED_ORIGINS`, `DATABASE_URL`, `APP_DOMAIN`, `LETSENCRYPT_EMAIL`.

> **Note:** Default workflow `docker compose up` does **not** pass `--profile traefik`. If you need Traefik on EC2, either add the profile to the script or run Traefik separately. Align the workflow with your production topology.

### 12.2 Live URLs (fill for your deployment)

| Item | Value |
|------|--------|
| Public API base | `https://<APP_DOMAIN>/` |
| Health | `https://<APP_DOMAIN>/health` |
| Swagger | `https://<APP_DOMAIN>/docs` |
| OpenAPI JSON | `https://<APP_DOMAIN>/openapi.json` |

---

## 13. Simulation data and seeding

### 13.1 Generators

- **`scripts/generate-master-data.js`** — provinces, districts, stations with geographic coherence.  
- **`scripts/generate-sim-data.js`** — many vehicles and time-series pings (synthetic movement).

### 13.2 Loader

- **`scripts/seed-postgres.js`** (or equivalent in repo) loads generated JSON into PostgreSQL via Prisma.

### 13.3 Methodology (high level)

- Master data uses realistic **Sri Lanka–oriented** administrative splits (counts described in earlier coursework narrative: e.g. multiple provinces/districts/stations).  
- Simulation uses **district-biased** coordinates with drift, speed/heading, and reduced movement at night.

*(Adjust counts if your generated files differ — verify on disk after running generators.)*

---

## 14. Testing

- **Framework:** Jest (`NODE_ENV=test`, ESM experimental VM modules).  
- **HTTP testing:** supertest against the Express **`app`** instance (no listen required).  
- **Coverage today:** at minimum **health** (`GET /health`) and **Swagger/OpenAPI** smoke tests (`/openapi.json`, `/docs/`, `/api-docs/`, redirect behavior).  

**Recommendations for coursework / production:**

- Add integration tests for **login** and one **scoped** list endpoint per role.  
- Add contract tests that **OpenAPI paths** match registered routes (grep or codegen).

---

## 15. Security posture (OWASP-aligned)

| Theme | Mitigation |
|-------|------------|
| Broken authentication | bcrypt; JWT verification; login validation. |
| Broken object level authorization | Role middleware + **service-level scope** checks. |
| Excessive data exposure | Controlled DTOs / response shaping in services. |
| Mass assignment | zod restricts writable fields per endpoint. |
| Lack of rate limiting | Rate limit on high-abuse ingestion route. |
| Security misconfiguration | helmet (with Swagger trade-offs), CORS allowlist, env-based secrets. |
| Injection | Prisma parameterized queries; zod validation. |

---

## 16. Limitations, scaling, and roadmap

### 16.1 Current limits

- History capped (**max 7 days**) to control query cost.  
- **Synchronous** ping ingestion (no queue).  
- **Pull-based** “live” rather than push subscriptions.  
- No refresh-token flow.  
- Limited automated integration test depth.

### 16.2 Scaling ideas

- Partition **`LocationPing`** by time.  
- Read replicas for heavy history.  
- Cache for live snapshot (Redis).  
- Message broker for ingest decoupling.  
- Materialized “latest location” table.

### 16.3 Security roadmap

- Refresh tokens + revocation.  
- Device attestation / mTLS for high-trust ingest.  
- Stricter per-device rate limits.  
- Vault for secrets; audit log store.

### 16.4 Product extensions

- Dashboards, map playback, geofencing, anomaly detection, case exports.

---

## 17. Privacy, ethics, and compliance

- Location data is **sensitive**; production use requires **lawful basis**, **retention limits**, and **access auditing** aligned with local privacy law.  
- This codebase is a **technical demonstration**; governance policies are the operator’s responsibility.  
- Minimize stored fields; encrypt at rest (database provider feature); secure transport (HTTPS).

---

## 18. Appendices

### Appendix A — Environment variables (local `.env`)

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port (default 8000) |
| `NODE_ENV` | `development` / `production` / `test` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signing key for JWT |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `1h`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins; `*` for allow-all (use carefully) |
| `PUBLIC_BASE_URL` | Optional; public URL for Swagger “Try it out” |

### Appendix B — `.env.docker` (container runtime)

Same core vars as above for the app container. Used by **`env_file`** in Compose.

### Appendix C — Compose-time `.env` (project root, for Traefik labels)

| Variable | Purpose |
|----------|---------|
| `APP_DOMAIN` | Host rule for Traefik router |
| `LETSENCRYPT_EMAIL` | ACME account email |

### Appendix D — NPM scripts (reference)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Run API with watch |
| `npm start` | Run API |
| `npm test` | Jest |
| `npm run lint` | ESLint |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:push` | Push schema to DB |
| `npm run seed:master` | Generate master JSON |
| `npm run seed:sim` | Generate simulation JSON |
| `npm run seed:db` | Load seeds into DB |

### Appendix E — Repository checklist for submission

- [ ] Fill `<REPO_URL>` and deployment URLs in this report.  
- [ ] Confirm `.env.example` / `.env.docker.example` match current code.  
- [ ] Run `npm test` and `npm run lint` before zip/submit.  
- [ ] Redact all secrets from PDF/screenshots.  
- [ ] Grant lecturer access per institution policy.

### Appendix F — AI assistance disclosure (template)

If required by your institution, state clearly:

- Whether **AI tools** assisted with design, implementation, debugging, or documentation.  
- That outputs were **reviewed, tested, and adapted** by the project authors.

---

## Document history

| Version | Date | Notes |
|---------|------|--------|
| 2.0 | 2026-05-03 | Expanded with full API catalog, Docker/Traefik/Compose details, OpenAPI section, CI/CD, appendices. |
| 1.0 | *(prior)* | Original business + architecture narrative. |

---

*End of report.*
