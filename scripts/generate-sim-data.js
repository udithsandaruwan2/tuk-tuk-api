import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const baseDistricts = [
  { code: "COL", lat: 6.9271, lng: 79.8612 },
  { code: "GAM", lat: 7.0917, lng: 79.9998 },
  { code: "KAN", lat: 7.2906, lng: 80.6337 },
  { code: "GAL", lat: 6.0535, lng: 80.221 },
  { code: "JAF", lat: 9.6615, lng: 80.0255 }
];

const random = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const makeRegNumber = (i) => {
  const prefixes = ["WP", "CP", "SP", "NP", "EP"];
  const series = ["CA", "BA", "KA", "TA", "MA"];
  return `${pick(prefixes)}-${pick(series)}-${String(1000 + i)}`;
};

const start = new Date();
start.setDate(start.getDate() - 7);
start.setMinutes(0, 0, 0);

const vehicles = [];
const pings = [];

for (let i = 0; i < 220; i += 1) {
  const district = pick(baseDistricts);
  const vehicle = {
    regNumber: makeRegNumber(i),
    deviceId: randomUUID(),
    driverName: `Driver ${i + 1}`,
    status: "ACTIVE",
    districtCode: district.code
  };
  vehicles.push(vehicle);

  const points = [];
  let currentLat = district.lat;
  let currentLng = district.lng;
  for (let h = 0; h < 168; h += 1) {
    const dayHour = h % 24;
    const timestamp = new Date(start.getTime() + h * 60 * 60 * 1000);
    if (dayHour >= 0 && dayHour < 6) {
      points.push({ timestamp: timestamp.toISOString(), lat: currentLat, lng: currentLng, speed: 0, heading: 0 });
      continue;
    }
    currentLat += random(-0.005, 0.005);
    currentLng += random(-0.005, 0.005);
    points.push({
      timestamp: timestamp.toISOString(),
      lat: currentLat,
      lng: currentLng,
      speed: random(5, 60),
      heading: random(0, 360)
    });
  }
  pings.push({ regNumber: vehicle.regNumber, points });
}

const outputPath = path.resolve("data/generated/sim-seed-sample.json");
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify({ vehicles, pings }, null, 2));
console.log(`Simulation seed sample generated at ${outputPath}`);
