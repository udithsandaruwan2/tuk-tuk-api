# tuk-tuk-api

REST API project (NIBM / Coventry NB6007CEM coursework): real-time tuk-tuk tracking for law enforcement — **API only**.

**Student ID:** *add your student ID here*

## Final status (Week 1-4 complete)

- Node.js **ESM** toolchain, ESLint, Prettier, `src/` layout (`routes`, `services`, `middleware`).
- **MongoDB** + **Mongoose** models: provinces, districts, police stations, users, vehicles, tracker devices, location pings.
- **Docker Compose** for local MongoDB.
- **Seeds**: 9 provinces, 25 districts, 26 police stations, 200 vehicles + devices, ~8 days of 30‑minute GPS samples (06:00–22:00 Asia/Colombo), demo users.
- Week 2 API shell: Express app, central error handler, request logging, `/` (links), `/health`.
- Week 2 read endpoints under `/v1`:
  - Boundaries: `GET /provinces`, `GET /districts`, `GET /stations`, `GET /districts/:districtId/stations`
  - Vehicles: `GET /vehicles`, `GET /vehicles/:vehicleId`, `GET /vehicles/:vehicleId/location/latest`, `GET /vehicles/:vehicleId/locations?from=&to=`
  - Ops analytics: `GET /analytics/vehicles-by-district`, `GET /analytics/active-vehicles?minutes=30`
- Swagger stubs published at `/api-docs`.
- Security and writes:
  - Auth: `POST /v1/auth/login` (JWT bearer for users)
  - RBAC + scope (`HQ_ADMIN`, `PROVINCIAL`, `STATION`) applied to week-2 read routes
  - Admin vehicle writes: `POST /v1/vehicles`, `PATCH /v1/vehicles/:vehicleId`
  - Device ingest: `POST /v1/devices/:deviceId/pings` with `x-device-key`
- Week 4 hardening and delivery:
  - Security middleware (`helmet`, global rate limit, login rate limit, configurable CORS)
  - CI/CD workflow for EC2 deployment (`.github/workflows/node-cicd.yml`)
  - Dockerized deployment using one compose file (`docker-compose.yml`, `Dockerfile`)
  - Production-safe seed strategy (`npm run db:seed:if-empty`)
  - Demo automation (`scripts/demo-api.sh`, `docs/demo.md`)
  - Formal report draft from ADRs (`docs/report-formal-final.md`)
- Docs: `[docs/adr/](docs/adr/)`, `[docs/data-dictionary.md](docs/data-dictionary.md)`, `[docs/simulation.md](docs/simulation.md)`, `[docs/project-architecture-guide.md](docs/project-architecture-guide.md)`, `[docs/technical-documentation-final.md](docs/technical-documentation-final.md)`, sample JSON under `[data/samples/](data/samples/)`.

## Prerequisites

- Node.js **20+**
- Docker (for MongoDB) *or* your own MongoDB instance

## Quick start

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:seed          # reference + simulation data
npm run dev
```

Mongo is exposed on **host port 27017**. Set `MONGODB_URI` in `.env` (default is `mongodb://localhost:27017/tuk_tuk`).

### Scripts


| Script                            | Purpose                      |
| --------------------------------- | ---------------------------- |
| `npm run dev`                     | Run API server in watch mode |
| `npm run db:seed`                 | Run `scripts/seed-mongo.js`  |
| `npm run db:seed:if-empty`        | Seed only when DB is empty   |
| `npm run lint` / `npm run format` | Code style                   |


## Deployed API (fill in after Week 4)

- **API base URL:** *to be added*
- **Swagger UI:** *to be added*

## GitHub

Add your instructor as a collaborator before the coursework deadline (per assessment brief).

## CI/CD

- Workflow file: `.github/workflows/node-cicd.yml`
- Compose file: `docker-compose.yml`
- Docker image definition: `Dockerfile`

## Demo

```bash
BASE_URL=http://localhost:3000 ./scripts/demo-api.sh
```

## License

See [LICENSE](LICENSE).