# ADR 0002: Auth model, RBAC scoping, and device ingest

## Status

Accepted (Week 3)

## Context

The API must distinguish between:

- human law-enforcement users (HQ, provincial, station),
- tracker devices that submit location pings.

The coursework requires secure access and role-aware behavior while remaining simple enough for demonstration and viva explanation.

## Decision

1. **Human auth uses JWT (Bearer)**
   - `/v1/auth/login` verifies `email + password` and returns an access token.
   - Token includes `role`, and optional `provinceId` / `stationId` for scope enforcement.

2. **Devices use API-key header**
   - Ingest endpoint: `POST /v1/devices/:deviceId/pings`
   - Requires `x-device-key`.
   - Keys are never stored in plaintext; only bcrypt hash in `TrackerDevice.apiKeyHash`.

3. **RBAC scope rules**
   - `HQ_ADMIN`: global visibility and write authority.
   - `PROVINCIAL`: limited to vehicles/districts/stations under `provinceId`.
   - `STATION`: limited to assigned `stationId`.

4. **Operational safeguards on ingest**
   - Coordinate range checks.
   - Timestamp skew checks (future/past limits).
   - Minimum interval throttle per device (basic anti-flood).

## Consequences

- Route behavior is predictable and easy to explain in viva.
- Device and human identities are separated cleanly.
- The design is production-leaning while staying lightweight for coursework.
- Future enhancement path: refresh tokens, key rotation, dedicated audit tables.
