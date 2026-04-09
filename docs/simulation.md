# Simulation data (Week 1)

## Administrative reference data

- **9 provinces** — Western, Central, Southern, Northern, Eastern, North Western, North Central, Uva, Sabaragamuwa (`Province.code` matches common abbreviations, e.g. `WP`).
- **25 districts** — real district names with approximate centroid latitude/longitude for generating plausible GPS noise per district (`prisma/seed.js`).
- **26 police stations** — at least one station per seeded district (including Mullaitivu); codes like `COL-FT`, `KAN-01`.

## Vehicles and devices

- **200 vehicles** — distributed round-robin across all 25 districts.
- Registration numbers: `SL-{DISTRICT_CODE}-{0001..0200}` (unique).
- **Statuses**: mostly `ACTIVE`; a smaller set `INACTIVE` or `SUSPENDED` for filtering demos.
- **200 tracker devices** — one per vehicle; API key is `dev-device-{first-8-chars-of-uuid}` (logged for the first three vehicles during `npm run db:seed`). Keys are stored bcrypt-hashed in `TrackerDevice.apiKeyHash`.

## Location history

- **Eight full sliding days** ending on the current UTC calendar day at seed time.
- **Sampling**: every **30 minutes** between **06:00 and 22:00** Sri Lanka civil time (UTC+05:30), **no DST**.
- **Patterns** (vehicle index modulo 3):
  - **0 — Commute / corridor**: interpolation between two anchors (simulated “home” and “work”).
  - **1 — Rank idle**: small jitter around the police station centroid for the vehicle’s district.
  - **2 — Shuttle / pulse**: sinusoidal blend between anchors plus light noise; variable speed heading.

- **Volume**: about **33 pings per vehicle per day** × **8 days** × **200 vehicles** ≈ **52,800** rows (exact count logged by the seed script).

## Demo users

Plaintext password for all seeded users: `ChangeMe!Dev1` (bcrypt-hashed in DB).

| Email                          | Role                           |
| ------------------------------ | ------------------------------ |
| `hq.admin@police.lk`           | HQ_ADMIN                       |
| `western.provincial@police.lk` | PROVINCIAL (Western Province)  |
| `colombo.fort@police.lk`       | STATION (Colombo Fort station) |

## Re-running seeds

`prisma/seed.js` deletes all vehicles, devices, and pings before re-inserting, so reference geography and users are upserted safely while vehicles/pings stay reproducible in structure (timestamps depend on “today”).

## Export samples

Small static samples for reports live under [`data/samples/`](../data/samples/).
