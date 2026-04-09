# tuk-tuk-api

REST API project (NIBM / Coventry NB6007CEM coursework): real-time tuk-tuk tracking for law enforcement — **API only**.

**Student ID:** _add your student ID here_

## Week 1 status

- Node.js **ESM** toolchain, ESLint, Prettier, `src/` layout (`routes`, `services`, `middleware`).
- **PostgreSQL** + **Prisma** schema: provinces, districts, police stations, users, vehicles, tracker devices, location pings (indexed for history queries).
- **Docker Compose** for local Postgres.
- **Seeds**: 9 provinces, 25 districts, 26 police stations, 200 vehicles + devices, ~8 days of 30‑minute GPS samples (06:00–22:00 Asia/Colombo), demo users.
- Docs: [`docs/adr/`](docs/adr/), [`docs/data-dictionary.md`](docs/data-dictionary.md), [`docs/simulation.md`](docs/simulation.md), sample JSON under [`data/samples/`](data/samples/).

HTTP routes and deployment arrive in later weeks.

## Prerequisites

- Node.js **20+**
- Docker (for Postgres) _or_ your own PostgreSQL 16 instance

## Quick start

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:migrate:dev   # creates tables
npm run db:seed          # reference + simulation data
```

Postgres is exposed on **host port 5433** (see [`docker-compose.yml`](docker-compose.yml)) so it does not clash with an existing local PostgreSQL on 5432. Point `DATABASE_URL` in `.env` at `localhost:5433`.

Use `npm run db:studio` to browse tables.

### Scripts

| Script                            | Purpose                                                |
| --------------------------------- | ------------------------------------------------------ |
| `npm run dev`                     | Placeholder process (Week 2+ will run the HTTP server) |
| `npm run db:migrate:dev`          | Create/apply migrations (development)                  |
| `npm run db:migrate`              | Apply migrations (production/CD)                       |
| `npm run db:seed`                 | Run `prisma/seed.js`                                   |
| `npm run db:reset`                | Reset DB + migrate + seed                              |
| `npm run lint` / `npm run format` | Code style                                             |

## Deployed API (fill in after Week 4)

- **API base URL:** _to be added_
- **Swagger UI:** _to be added_

## GitHub

Add your instructor as a collaborator before the coursework deadline (per assessment brief).

## License

See [LICENSE](LICENSE).
