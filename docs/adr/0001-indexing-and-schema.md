# ADR 0001: Indexing and core schema

## Status

Accepted (Week 1)

## Context

The API must support:

- Historical tracks for a vehicle over arbitrary time windows.
- Operational queries that combine administrative filters (province, district, station) with “recent activity”.
- Device-authenticated ingestion at non-trivial volume during simulation.

## Decision

1. **Time in UTC**  
   `LocationPing.recordedAt` is stored in UTC. Sri Lanka display (Asia/Colombo, no DST) is an application concern.

2. **Compound index on pings**  
   Index `(vehicleId, recordedAt DESC)` to accelerate “latest ping” and “history in range” for a single vehicle.

3. **Secondary index on `recordedAt`**  
   Supports broader analytics queries that filter primarily by time (used lightly in coursework; keeps options open).

4. **Vehicle dimensions**  
   `Vehicle` references `districtId` and optional `stationId`. District is mandatory for boundary reporting. Station supports station-scoped RBAC in later weeks.

5. **Devices**  
   `TrackerDevice.apiKeyHash` stores a bcrypt hash of the device API key; plaintext keys are shown once during provisioning (Week 3+).

## Consequences

- Ingest and reads for one vehicle scale with window length, not full table scans, when the vehicle id is known.
- Cross-vehicle time-range scans may still be expensive at very large scale; partitioning or time-series storage would be a future change.
