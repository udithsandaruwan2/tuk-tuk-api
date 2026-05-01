# Tuk-Tuk Tracking API

Layered REST API for Sri Lanka tuk-tuk tracking with JWT auth, role-based access, PostgreSQL, and Swagger docs.

## Stack

- Node.js + Express
- PostgreSQL + Prisma
- JWT + bcryptjs
- zod validation
- helmet/cors/hpp/rate-limit
- swagger-jsdoc + swagger-ui-express

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

## Docker + Traefik

This repository is dockerized with Traefik and PostgreSQL.

1. Copy env template:
   - `cp .env.docker.example .env.docker`
2. Set your real Neon URL in `.env.docker`:
   - `DATABASE_URL=postgresql://...?...sslmode=require`
3. Start stack:
   - `docker compose up --build`
4. Open:
   - API through Traefik: `http://localhost:8081`
   - Traefik dashboard: `http://localhost:8080`

The compose file includes a local Postgres service by default.

## Default Seed Users

All use password: `Password123!`

- `hq.admin@example.com` (HQ_ADMIN)
- `prov.admin@example.com` (PROVINCIAL_ADMIN)
- `station.user@example.com` (STATION_USER)
- `device.client@example.com` (DEVICE_CLIENT)
