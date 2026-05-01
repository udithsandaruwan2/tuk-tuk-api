# Demo Script (Week 4)

## Prerequisites

- API running (`npm run dev` or deployed URL)
- Mongo seeded (`npm run db:seed`)

## Quick run

```bash
BASE_URL=http://localhost:3000 ./scripts/demo-api.sh
```

## Manual sequence

1. Login:

```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "content-type: application/json" \
  -d '{"email":"hq.admin@police.lk","password":"ChangeMe!Dev1"}'
```

1. Use bearer token for protected calls:

```bash
curl "http://localhost:3000/v1/provinces?page=1&limit=5" \
  -H "authorization: Bearer <token>"
```

1. Verify operational endpoint:

```bash
curl "http://localhost:3000/v1/analytics/active-vehicles?minutes=30" \
  -H "authorization: Bearer <token>"
```

1. Device ingest example:

```bash
curl -X POST http://localhost:3000/v1/devices/<deviceId>/pings \
  -H "x-device-key: <device-api-key>" \
  -H "content-type: application/json" \
  -d '{"latitude":6.91,"longitude":79.86,"speedKmh":18.2}'
```
