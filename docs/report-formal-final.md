# Formal Report Draft (from ADRs)

## 1. Business Requirements Analysis

The system is designed for law-enforcement visibility of registered three-wheelers in Sri Lanka. The core requirement is to provide a secure API that can (a) ingest periodic GPS pings from authorized tracking devices, (b) expose real-time and historical movement information to authorized users, and (c) support boundary-based filtering across province, district, and station levels.

Primary stakeholders are:

- Headquarters administrators (global visibility and administration),
- Provincial officers (province-scoped operations),
- Station officers (station-level operations and investigations),
- Tracking device clients (machine-to-machine location updates).

The system scope intentionally excludes client applications and focuses entirely on backend API delivery and demonstrable behavior using simulated data. This aligns with phased delivery and clear separation between backend capability and frontend concerns.

## 2. Design, Architecture, and Standards

### 2.1 Architectural approach

The API adopts a layered Node.js/Express architecture:

- request handling and middleware at application layer,
- route modules grouped by capability (`auth`, `boundaries`, `vehicles`, `analytics`, `ingest`),
- shared services for validation and database connection,
- MongoDB persistence via Mongoose models.

This structure improves maintainability, testability, and role-based enforcement consistency.

### 2.2 Data architecture and indexing decisions

The domain model captures administrative boundaries, users, vehicles, devices, and location pings. Core indexing strategy is centered on movement queries:

- index on `LocationPing(vehicleId, recordedAt desc)` for latest-position and historical-window retrieval.

This decision originates from ADR-0001 and directly supports investigative read performance for non-trivial datasets.

### 2.3 Security and access-control model

ADR-0002 defines dual-channel authentication:

- JWT bearer authentication for human users,
- API-key header authentication for tracker devices.

RBAC and scope rules are enforced by role:

- `HQ_ADMIN` -> global,
- `PROVINCIAL` -> province-scoped,
- `STATION` -> station-scoped.

Additional controls include schema validation, timestamp skew checks, coordinate range validation, and basic anti-flood protections on ingest frequency.

### 2.4 Standards and implementation quality

The implementation follows RESTful conventions:

- resource-oriented endpoints,
- consistent JSON response contracts,
- structured error payloads (`code`, `message`, optional `details`),
- pagination controls for list endpoints.

Code quality is controlled with ESLint and Prettier. API discoverability is provided through Swagger/OpenAPI docs at `/api-docs`.

## 3. Implementation Summary

Delivered backend capabilities include:

- authentication (`/v1/auth/login`),
- boundary and master-data reads,
- vehicle registry reads and updates (role-limited),
- latest and historical location retrieval,
- operational analytics endpoints,
- secure device ingest endpoint with keyed authentication.

Simulation data includes national boundary master data, station mapping, vehicle registry volume, and multi-day ping history generation.

## 4. Deployment and Operationalization

Production packaging is containerized:

- `Dockerfile` for API image,
- `docker-compose.yml` for API + Mongo deployment.

CI/CD is implemented with GitHub Actions:

- install/lint/format checks,
- Docker build verification,
- SSH deployment to EC2,
- post-deploy seed-if-empty step,
- health check validation.

This provides repeatable deployment and baseline operational assurance.

## 5. Limitations and Future Concerns

Current limitations:

- no refresh token/revocation workflow,
- limited automated test depth (manual smoke tests are currently primary),
- basic rate-control strategy (not adaptive/distributed),
- no dedicated forensic audit-log collection pipeline.

Future evolution can include:

- comprehensive integration test suite,
- stronger secret management and key-rotation strategy,
- audit/event stream for investigations,
- advanced geospatial optimization and partitioning at larger scale.

## 6. Appendix (Fill with your deployment details)

- Deployed API URL: `<add>`
- Swagger URL: `<add>`
- GitHub repository URL: `<add>`
- AI aide/prompt log URLs (if applicable): `<add>`

## 7. Mapping to Learning Outcomes

1. **Secure, standards-based API**: JWT + API-key auth, RBAC, HTTP security middleware, OpenAPI docs.
2. **Modern async web interaction support**: REST JSON endpoints designed for asynchronous clients.
3. **Data persistence management**: structured MongoDB collections with model constraints and indexing.
4. **Tool-based implementation of non-trivial requirements**: Express, Mongoose, Docker, GitHub Actions, seeded simulation, documented ADR process.
