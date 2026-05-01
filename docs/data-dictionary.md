# Data dictionary (Week 1 schema)

Legend: **R** read, **W** write (enforcement arrives in Week 3 with authentication).

| Entity            | Key fields                                                                                  | Notes                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Province**      | `code`, `name`                                                                              | 9 rows seed. **R**: all authenticated tiers (later). **W**: HQ only (later).                                |
| **District**      | `code`, `name`, `provinceId`                                                                | 25 rows. **R**: filtered by scope. **W**: HQ only (later).                                                  |
| **PoliceStation** | `code`, `name`, `districtId`                                                                | 26 stations (one per district). **R**: scoped. **W**: HQ (later); junior roles read-only per ADR in Week 3. |
| **User**          | `email`, `passwordHash`, `role`, `provinceId?`, `stationId?`                                | `HQ_ADMIN`: no scope. `PROVINCIAL`: `provinceId` set. `STATION`: `stationId` set.                           |
| **Vehicle**       | `registrationNumber`, `status`, `districtId`, `stationId?`, `driverName?`, `driverLicense?` | **R**: list/detail with filters. **W**: admin (later). Devices ping against the linked vehicle.             |
| **TrackerDevice** | `vehicleId`, `apiKeyHash`, `label`, `isActive`, `lastSeenAt`                                | **W**: admin provisioning (later). **Ping auth** uses API key (Week 3).                                     |
| **LocationPing**  | `vehicleId`, `recordedAt` (UTC), `latitude`, `longitude`, `speedKmh?`, `headingDeg?`        | **R**: history windows. **W**: device ingest (later).                                                       |

## Enumerations

- `UserRole`: `HQ_ADMIN`, `PROVINCIAL`, `STATION`
- `VehicleStatus`: `ACTIVE`, `INACTIVE`, `SUSPENDED`

## Integrity rules

- Every vehicle belongs to exactly one district; station assignment is optional but seeded for all demo vehicles.
- Deleting a vehicle cascades to its devices and location pings.
