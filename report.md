# Project Report: Tuk-Tuk Tracking API

## Business Requirements Analysis

### 1. Problem Context and Operational Need

Urban and semi-urban law enforcement operations require continuous visibility over registered public transport movement, especially for safety monitoring, incident response, and jurisdictional accountability. In this project context, tuk-tuks are treated as monitored mobile assets that submit location pings to a centralized platform. Without centralized tracking, police authorities rely on fragmented and delayed reports, which weakens early detection of suspicious movement, slows investigations, and complicates inter-district coordination.

The core business requirement is therefore to provide a secure backend API that supports:

- near real-time monitoring of active vehicles,
- historical movement retrieval for investigations,
- geographic filtering by province and district,
- role-based operational boundaries across administrative levels.

This backend acts as a foundational service layer that can later power web dashboards, mobile interfaces, and analytics tools.

### 2. Stakeholders

The primary stakeholders are:

- **HQ Administrators**: Require full national visibility, cross-boundary search, and management capabilities (e.g., vehicle onboarding and policy control).
- **Provincial/District Police Users**: Require scoped visibility limited to assigned jurisdictions for operational integrity and least-privilege access.
- **Device Clients**: Represent in-vehicle authenticated clients responsible for sending telemetry/location pings.

Secondary stakeholders include academic evaluators, platform maintainers, and future frontend consumers that integrate with this API.

### 3. Scope Definition

The implemented project scope includes:

- secure authentication and authorization,
- role-aware data access control,
- master data retrieval (provinces, districts, stations),
- vehicle lifecycle APIs (list/register),
- live location retrieval,
- historical location retrieval with bounded window,
- ingestion endpoint for device pings,
- OpenAPI/Swagger documentation,
- deployable containerized backend with cloud database connectivity.

This scope directly addresses command-and-control backend concerns and aligns with typical public safety telemetry platform requirements.

### 4. Out of Scope

The following are explicitly out of scope in this submission:

- end-user client applications (mobile/web UI),
- hardware firmware implementation for GPS trackers,
- physical sensor integration and real-world telematics validation,
- command center visualization tooling,
- law-enforcement workflow UX design.

The backend is intentionally designed as a robust service foundation that can be extended by those components later.

### 5. Non-Functional Requirements

Key non-functional requirements and how they are addressed:

- **Security**: JWT-based auth, role middleware, request validation, secure headers, rate limiting, CORS control, production-safe error responses.
- **Performance**: indexed historical queries, pagination on list endpoints, capped history query range (max 7 days), efficient read patterns.
- **Scalability**: stateless API design, cloud-managed PostgreSQL compatibility (Neon), containerized deployment, clear service boundaries for future decomposition.
- **Data retention and governance readiness**: schema structure and timestamped pings support future retention policies, archival tiers, and compliance controls.

These requirements were considered as first-class design constraints, not post-implementation add-ons.

---

## Design, Architecture & Implementation

### 1. RESTful API Design Principles

The API follows REST-oriented conventions:

- **Resource-based URIs**: `/api/provinces`, `/api/vehicles`, `/api/location/live`, etc.
- **HTTP verbs by intent**:
  - `GET` for retrieval,
  - `POST` for creation/ingestion.
- **Status code semantics**:
  - `200` success retrieval,
  - `201` created,
  - `400` validation failures,
  - `401` unauthorized,
  - `403` forbidden by role/scope,
  - `404` unknown resources,
  - `500` internal server issues.
- **Pagination** through `page` and `limit` query parameters for list/history endpoints.
- **Consistent JSON response envelope** (`success`, `message`, `data`) for predictable client consumption.

HATEOAS links were considered optional and not implemented in this version to keep payloads lightweight and focused for operational APIs.

### 2. Architecture Pattern and Justification

The solution adopts a layered architecture:

- **Routes**: endpoint definitions and middleware composition.
- **Controllers**: request-to-service orchestration and response formatting.
- **Services**: core business logic and data access orchestration.
- **Middleware**: authentication, role checks, validation, error handling, 404 fallback.
- **Config layer**: DB client, Swagger configuration, environment-driven settings.

This structure improves:

- maintainability (clear separation of concerns),
- testability (logic isolated from transport),
- extensibility (new endpoints/roles added with minimal cross-cutting impact),
- onboarding speed for future contributors.

### 3. Data Model Design (PostgreSQL + Prisma)

The backend uses PostgreSQL with Prisma ORM and a normalized schema:

- `Province`
- `District` (belongs to Province)
- `PoliceStation` (belongs to District)
- `Vehicle` (optionally mapped to current District)
- `LocationPing` (belongs to Vehicle, time-series telemetry)
- `User` (with role and optional scope relationships)

Supporting enums:

- `Role`: `HQ_ADMIN`, `PROVINCIAL_ADMIN`, `STATION_USER`, `DEVICE_CLIENT`
- `VehicleStatus`: `ACTIVE`, `INACTIVE`, `MAINTENANCE`

This schema preserves relational integrity for jurisdiction hierarchy and supports role-scoped filtering logic with minimal ambiguity.

### 4. Indexing Strategy and Query Efficiency

Indexing is central to location workloads:

- `LocationPing(vehicleId, timestamp DESC)` for efficient per-vehicle history scans.
- Uniques on `User.email`, `Vehicle.regNumber`, `Vehicle.deviceId`.
- Secondary indexes on role/status/scope linkage fields.

These choices prioritize the dominant read patterns:

- latest/ordered history retrieval,
- credential lookups,
- filtered vehicle inventories.

### 5. Authentication and Authorization Flow

Authentication flow:

1. User/device posts credentials to `/api/auth/login`.
2. Password verified using bcrypt hash comparison.
3. JWT access token issued with role and scope claims:
  - user ID (`sub`),
  - role,
  - operational scope (`provinceId`, `stationId`, `vehicleId` where relevant).
4. Client sends bearer token on protected requests.

Authorization flow:

- `authenticate` middleware verifies token integrity.
- `authorizeRoles` middleware enforces role-level access.
- service-level checks enforce data scope constraints (e.g., device can only submit pings for its assigned vehicle).

Token lifecycle:

- Current implementation uses short-lived access tokens (configurable, default 1 hour).
- Refresh-token rotation is identified as a future enhancement in scaling/security roadmap.

### 6. Validation, Rate Limiting, and Error Handling

Validation:

- zod schemas validate body/query/params.
- examples include latitude/longitude bounds, date parsing, pagination constraints, and required payload fields.
- input is parsed and passed through validated request context to avoid unsafe mutation.

Rate limiting:

- `/api/location/ping` protected with request-per-minute limit to reduce abuse and accidental floods.

Error handling:

- centralized error middleware emits standardized JSON errors,
- production responses avoid leaking internals,
- explicit API errors used for controlled business failures (invalid credentials, forbidden access, invalid date ranges, etc.).

### 7. Security Controls and Standards Alignment

Security controls implemented:

- `helmet` for HTTP hardening (with Swagger-compatible CSP adjustment),
- CORS with configurable allowlist / wildcard behavior,
- HPP protection for parameter pollution mitigation,
- JWT signature verification,
- role and scope authorization checks,
- defensive validation on all major request types.

Alignment with **OWASP API Security Top 10** themes:

- broken object level authorization mitigation via scoped access checks,
- excessive data exposure mitigation via controlled response shapes,
- mass assignment risk reduced through schema validation,
- lack of resource/rate limiting mitigated for ingestion endpoint,
- security misconfiguration addressed through explicit middleware strategy.

### 8. Simulation Data Generation Methodology

To avoid manual/static data authoring and ensure reproducibility:

- Master data generator creates:
  - 9 provinces,
  - 25 districts,
  - 20+ police stations with realistic mappings and coordinates.
- Simulation generator creates:
  - 220 vehicles,
  - one-week movement traces.

Movement logic:

- base coordinates per assigned district,
- periodic random coordinate drift to imitate movement,
- low/zero movement during late-night hours,
- bounded synthetic speed/heading values.

Seeder then loads generated artifacts into PostgreSQL and inserts role-specific default users for testing.

### 9. Deployment Architecture and Runtime

Deployment uses:

- containerized app (`Dockerfile`),
- Traefik reverse proxy routing,
- optional HTTPS automation via Let’s Encrypt,
- environment-driven runtime configuration,
- CI/CD workflow on GitHub Actions,
- EC2 remote deployment over SSH.

Database runs on Neon PostgreSQL, removing local DB dependency from production deployment and supporting managed cloud scaling primitives.

### 10. API Documentation and Developer Experience

OpenAPI is exposed through Swagger UI at `/docs`.
Documentation includes all major routes, enabling:

- quick manual testing,
- integration onboarding for client developers,
- endpoint discoverability during demos and evaluation.

The project also includes root and health endpoints to assist operational checks and deployment smoke tests.

### 11. ES6+ and Engineering Practices

Codebase implementation uses modern JavaScript features:

- ES modules,
- async/await for non-blocking operations,
- optional chaining and nullish handling for defensive access,
- structured middleware composition,
- consistent linting/testing scripts.

These practices improve readability, maintainability, and runtime reliability.

---

## Appendix: Deployment Details

### 1. Live API URL

- **Live API base URL**: `https://<APP_DOMAIN>/`
- **Health check**: `https://<APP_DOMAIN>/health`

### 2. Swagger Documentation

- **Swagger UI**: `https://<APP_DOMAIN>/docs/`
- **OpenAPI JSON**: exportable from Swagger UI or through the generated spec runtime.

### 3. Repository and Access

- **GitHub repository**: `<REPO_URL>`
- README should include student identification as required by module instructions.
- Lecturer/collaborator access should be granted according to submission policy.

### 4. Environment and Secrets

Deployment uses runtime secrets (GitHub Secrets + EC2 runtime file generation) for:

- database URL,
- JWT secret,
- CORS config,
- domain and HTTPS settings.

No production credentials are committed to source control.

### 5. AI Assistance Disclosure

AI-assisted support was used for:

- architecture drafting,
- implementation acceleration,
- documentation scaffolding,
- deployment troubleshooting.

All output was reviewed, adapted, and validated within the project context.

---

## Limitations, Scaling & Further Concerns

### 1. Current Functional and Technical Limits

The current version is intentionally backend-first and has known practical limits:

- History endpoint enforces a **maximum 7-day window** to contain heavy scans.
- Location ingestion is synchronous request-response.
- Live feed is pull-based (`GET /location/live`) rather than push-stream.
- No WebSocket/SSE broadcast path for operator consoles.
- Limited observability stack (no centralized metrics, tracing, or alert dashboards by default).

These are acceptable for coursework scope and moderate traffic prototypes but require evolution for high-scale production.

### 2. Performance and Scalability Strategy

As ingestion scale grows (higher ping frequency, more vehicles, more concurrent operators), bottlenecks can emerge in write amplification and hot read paths.

Recommended scaling trajectory:

1. **Time partitioning** of `LocationPing` by month/week to constrain index sizes and accelerate time-bounded queries.
2. **Read replicas** for heavy analytical/history traffic separation from write-primary.
3. **Redis caching** for `/location/live` snapshots to reduce repeated DB scans.
4. **Message broker integration** (Kafka/RabbitMQ/NATS) for high-frequency ingest decoupling:
  - API writes quickly to queue,
  - consumer service performs durable persistence and enrichment.
5. **Background materialization** of “latest vehicle location” table for O(1)-style live reads.

### 3. Security Hardening Roadmap

Current controls are solid for baseline API exposure, but production-grade law-enforcement systems require additional hardening:

- refresh token rotation with revocation lists,
- short-lived access tokens and optional device-bound claims,
- mTLS or device certificate pinning for trusted ingestion clients,
- stricter IP/rate heuristics per device identity (not just by endpoint),
- secret rotation policies and vault-based runtime retrieval,
- advanced audit logging with tamper-evident retention.

Compliance and governance concerns:

- region-specific privacy laws and data minimization obligations,
- configurable retention/erasure policies for historical telemetry,
- access auditability for each role and resource.

### 4. Reliability and Operational Concerns

For reliable operations in production:

- add circuit breakers and retry policies around DB/network boundaries,
- define SLOs (ingestion latency, live feed freshness, auth response time),
- enable structured logs and distributed traces,
- add readiness/liveness probes and automated rollback strategy in CI/CD.

Disaster recovery considerations include:

- managed backups and point-in-time recovery,
- tested restore runbooks,
- environment parity for staging and production.

### 5. Functional Extension Opportunities

Future feature roadmap can include:

- dedicated mobile/web dashboards for command staff,
- map-based playback and timeline exploration,
- route anomaly detection using historical baselines,
- geofencing alerts for high-risk zones or boundary breaches,
- suspicious behavior scoring models,
- case-linked evidentiary exports for investigations.

These features are now feasible because the current backend provides a cleanly structured foundation with scoped access, relational geography, and standardized telemetry endpoints.

### 6. Final Reflection

The project successfully delivers a secure, role-aware, documented REST backend for telemetry visibility and investigation support. It demonstrates how practical API engineering principles (clean architecture, schema discipline, scoped authorization, and deployment automation) can be combined into a realistic public-sector operations platform baseline.

While not yet a full end-user product, the implemented backend is a robust core service that is technically prepared for iterative scaling, stronger compliance controls, and advanced analytics integrations.