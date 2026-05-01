#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
EMAIL="${EMAIL:-hq.admin@police.lk}"
PASSWORD="${PASSWORD:-ChangeMe!Dev1}"

echo "1) Login"
TOKEN=$(curl -s -X POST "$BASE_URL/v1/auth/login" -H "content-type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const j=JSON.parse(d);console.log(j.data.accessToken);});')

echo "2) List provinces"
curl -s "$BASE_URL/v1/provinces?page=1&limit=5" -H "authorization: Bearer $TOKEN"

echo "\n3) List vehicles"
curl -s "$BASE_URL/v1/vehicles?page=1&limit=3" -H "authorization: Bearer $TOKEN"

echo "\n4) Analytics"
curl -s "$BASE_URL/v1/analytics/vehicles-by-district" -H "authorization: Bearer $TOKEN"
#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
EMAIL="${EMAIL:-hq.admin@police.lk}"
PASSWORD="${PASSWORD:-ChangeMe!Dev1}"

echo "1) Login"
TOKEN=$(curl -s -X POST "$BASE_URL/v1/auth/login" -H "content-type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const j=JSON.parse(d);console.log(j.data.accessToken);});')

echo "2) List provinces"
curl -s "$BASE_URL/v1/provinces?page=1&limit=5" -H "authorization: Bearer $TOKEN"

echo "\n3) List vehicles"
curl -s "$BASE_URL/v1/vehicles?page=1&limit=3" -H "authorization: Bearer $TOKEN"

echo "\n4) Analytics"
curl -s "$BASE_URL/v1/analytics/vehicles-by-district" -H "authorization: Bearer $TOKEN"
