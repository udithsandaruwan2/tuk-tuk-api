import { PrismaClient, UserRole, VehicleStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Deterministic PRNG (Mulberry32). */
function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0xc0ffee);

const PROVINCES = [
  { code: "WP", name: "Western" },
  { code: "CP", name: "Central" },
  { code: "SP", name: "Southern" },
  { code: "NP", name: "Northern" },
  { code: "EP", name: "Eastern" },
  { code: "NWP", name: "North Western" },
  { code: "NCP", name: "North Central" },
  { code: "UP", name: "Uva" },
  { code: "SG", name: "Sabaragamuwa" },
];

/**
 * 25 districts mapped to province codes (real names).
 * Centroids are approximate for simulation.
 */
const DISTRICTS = [
  { code: "COL", name: "Colombo", provinceCode: "WP", lat: 6.9271, lng: 79.8612 },
  { code: "GAM", name: "Gampaha", provinceCode: "WP", lat: 7.0913, lng: 79.9996 },
  { code: "KAL", name: "Kalutara", provinceCode: "WP", lat: 6.5854, lng: 79.9612 },
  { code: "KAN", name: "Kandy", provinceCode: "CP", lat: 7.2906, lng: 80.6337 },
  { code: "MAT", name: "Matale", provinceCode: "CP", lat: 7.467, lng: 80.623 },
  { code: "NUE", name: "Nuwara Eliya", provinceCode: "CP", lat: 6.9497, lng: 80.7891 },
  { code: "GAL", name: "Galle", provinceCode: "SP", lat: 6.0329, lng: 80.2168 },
  { code: "MTR", name: "Matara", provinceCode: "SP", lat: 5.9549, lng: 80.555 },
  { code: "HAM", name: "Hambantota", provinceCode: "SP", lat: 6.1241, lng: 81.1185 },
  { code: "JAF", name: "Jaffna", provinceCode: "NP", lat: 9.6615, lng: 80.0255 },
  { code: "KIL", name: "Kilinochchi", provinceCode: "NP", lat: 9.3961, lng: 80.3982 },
  { code: "MAN", name: "Mannar", provinceCode: "NP", lat: 8.9772, lng: 79.9048 },
  { code: "VAV", name: "Vavuniya", provinceCode: "NP", lat: 8.7504, lng: 80.4971 },
  { code: "MUL", name: "Mullaitivu", provinceCode: "NP", lat: 9.2671, lng: 80.8142 },
  { code: "TRI", name: "Trincomalee", provinceCode: "EP", lat: 8.5874, lng: 81.2152 },
  { code: "BAT", name: "Batticaloa", provinceCode: "EP", lat: 7.7171, lng: 81.7005 },
  { code: "AMP", name: "Ampara", provinceCode: "EP", lat: 7.297, lng: 81.681 },
  { code: "KUR", name: "Kurunegala", provinceCode: "NWP", lat: 7.4729, lng: 80.3543 },
  { code: "PUT", name: "Puttalam", provinceCode: "NWP", lat: 8.0362, lng: 79.8283 },
  { code: "ANU", name: "Anuradhapura", provinceCode: "NCP", lat: 8.3455, lng: 80.3887 },
  { code: "POL", name: "Polonnaruwa", provinceCode: "NCP", lat: 7.9333, lng: 81.019 },
  { code: "BAD", name: "Badulla", provinceCode: "UP", lat: 6.9934, lng: 81.055 },
  { code: "MON", name: "Monaragala", provinceCode: "UP", lat: 6.8725, lng: 81.3507 },
  { code: "RAT", name: "Ratnapura", provinceCode: "SG", lat: 6.6828, lng: 80.3992 },
  { code: "KEG", name: "Kegalle", provinceCode: "SG", lat: 7.2513, lng: 80.3464 },
];

/** ≥20 police stations tied to districts. */
const STATIONS = [
  { code: "COL-FT", name: "Colombo Fort Police Station", districtCode: "COL" },
  { code: "COL-MR", name: "Maradana Police Station", districtCode: "COL" },
  { code: "GAM-01", name: "Gampaha Division HQ", districtCode: "GAM" },
  { code: "KAL-01", name: "Kalutara Police Station", districtCode: "KAL" },
  { code: "KAN-01", name: "Kandy Police Station", districtCode: "KAN" },
  { code: "MAT-01", name: "Matale Police Station", districtCode: "MAT" },
  { code: "NUE-01", name: "Nuwara Eliya Police Station", districtCode: "NUE" },
  { code: "GAL-01", name: "Galle Police Station", districtCode: "GAL" },
  { code: "MTR-01", name: "Matara Police Station", districtCode: "MTR" },
  { code: "HAM-01", name: "Hambantota Police Station", districtCode: "HAM" },
  { code: "JAF-01", name: "Jaffna Police Station", districtCode: "JAF" },
  { code: "KIL-01", name: "Kilinochchi Police Station", districtCode: "KIL" },
  { code: "MAN-01", name: "Mannar Police Station", districtCode: "MAN" },
  { code: "VAV-01", name: "Vavuniya Police Station", districtCode: "VAV" },
  { code: "MUL-01", name: "Mullaitivu Police Station", districtCode: "MUL" },
  { code: "TRI-01", name: "Trincomalee Harbour Police", districtCode: "TRI" },
  { code: "BAT-01", name: "Batticaloa Police Station", districtCode: "BAT" },
  { code: "AMP-01", name: "Ampara Police Station", districtCode: "AMP" },
  { code: "KUR-01", name: "Kurunegala Police Station", districtCode: "KUR" },
  { code: "PUT-01", name: "Puttalam Police Station", districtCode: "PUT" },
  { code: "ANU-01", name: "Anuradhapura Police Station", districtCode: "ANU" },
  { code: "POL-01", name: "Polonnaruwa Police Station", districtCode: "POL" },
  { code: "BAD-01", name: "Badulla Police Station", districtCode: "BAD" },
  { code: "MON-01", name: "Monaragala Police Station", districtCode: "MON" },
  { code: "RAT-01", name: "Ratnapura Police Station", districtCode: "RAT" },
  { code: "KEG-01", name: "Kegalle Police Station", districtCode: "KEG" },
];

/** Sri Lanka local civil time (no DST): UTC + 5h 30m */
function slWallTimeToUtc(year, month, day, hour, minute = 0) {
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - (5 * 60 + 30) * 60 * 1000;
  return new Date(utcMs);
}

/**
 * Ping schedule: 30-minute slots between 06:00 and 22:00 SL, for `dayCount` full days ending today (UTC).
 * Patterns: commute loop, rank idle jitter, hub shuttle.
 */
function buildPingsForVehicle(vehicleIndex, district, station, vehicleId, dayCount = 8) {
  const pattern = vehicleIndex % 3;
  const dInfo = DISTRICTS.find((d) => d.code === district.code);
  const hubLat = dInfo.lat + (vehicleIndex % 7) * 0.01 - 0.03;
  const hubLng = dInfo.lng + ((vehicleIndex * 3) % 5) * 0.01 - 0.02;
  const anchorA = { lat: hubLat, lng: hubLng };
  const anchorB = {
    lat: hubLat + 0.04 + (vehicleIndex % 5) * 0.002,
    lng: hubLng + 0.05 + (vehicleIndex % 3) * 0.003,
  };

  const pings = [];
  const now = new Date();
  const endDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  for (let d = dayCount - 1; d >= 0; d -= 1) {
    const day = new Date(endDay);
    day.setUTCDate(day.getUTCDate() - d);
    const y = day.getUTCFullYear();
    const m = day.getUTCMonth() + 1;
    const dayNum = day.getUTCDate();

    for (let h = 6; h <= 22; h += 1) {
      for (const minute of [0, 30]) {
        if (h === 22 && minute === 30) continue;
        const t = slWallTimeToUtc(y, m, dayNum, h, minute);
        const slot = (h - 6) * 2 + (minute === 30 ? 1 : 0);
        const phase = slot / 34;

        let lat;
        let lng;
        let speedKmh;
        let headingDeg;

        if (pattern === 0) {
          const workSide = phase < 0.45 ? 0 : 1;
          const blend = workSide === 0 ? phase / 0.45 : (phase - 0.45) / 0.55;
          lat = anchorA.lat + (anchorB.lat - anchorA.lat) * blend;
          lng = anchorA.lng + (anchorB.lng - anchorA.lng) * blend;
          speedKmh = workSide === 0 ? 18 + (vehicleIndex % 10) : 22 + (vehicleIndex % 8);
          headingDeg = workSide === 0 ? 95 : 275;
        } else if (pattern === 1) {
          const jitter = (rand() - 0.5) * 0.004;
          lat = station ? station._centroidLat + jitter : hubLat + jitter;
          lng = station ? station._centroidLng + jitter : hubLng + (rand() - 0.5) * 0.004;
          speedKmh = slot % 4 === 0 ? 0 : 8;
          headingDeg = (slot * 17 + vehicleIndex * 3) % 360;
        } else {
          const pulse = Math.sin(phase * Math.PI * 2) * 0.5 + 0.5;
          lat = anchorA.lat + (anchorB.lat - anchorA.lat) * pulse + (rand() - 0.5) * 0.0015;
          lng = anchorA.lng + (anchorB.lng - anchorA.lng) * pulse + (rand() - 0.5) * 0.0015;
          speedKmh = 12 + Math.round(10 * Math.abs(Math.cos(phase * Math.PI * 3)));
          headingDeg = (phase * 360 + vehicleIndex * 11) % 360;
        }

        pings.push({
          vehicleId,
          recordedAt: t,
          latitude: Math.round(lat * 1_000_000) / 1_000_000,
          longitude: Math.round(lng * 1_000_000) / 1_000_000,
          speedKmh,
          headingDeg,
        });
      }
    }
  }

  return pings;
}

async function main() {
  console.info("Seeding provinces & districts…");
  const provinceByCode = new Map();
  for (const p of PROVINCES) {
    const row = await prisma.province.upsert({
      where: { code: p.code },
      create: { code: p.code, name: p.name },
      update: { name: p.name },
    });
    provinceByCode.set(p.code, row);
  }

  const districtByCode = new Map();
  for (const d of DISTRICTS) {
    const province = provinceByCode.get(d.provinceCode);
    const row = await prisma.district.upsert({
      where: { code: d.code },
      create: {
        code: d.code,
        name: d.name,
        provinceId: province.id,
      },
      update: { name: d.name, provinceId: province.id },
    });
    districtByCode.set(d.code, { ...row, centroidLat: d.lat, centroidLng: d.lng });
  }

  console.info("Seeding police stations…");
  const stationByCode = new Map();
  for (const s of STATIONS) {
    const district = districtByCode.get(s.districtCode);
    const row = await prisma.policeStation.upsert({
      where: { code: s.code },
      create: {
        code: s.code,
        name: s.name,
        districtId: district.id,
      },
      update: { name: s.name, districtId: district.id },
    });
    stationByCode.set(s.code, {
      ...row,
      _centroidLat: district.centroidLat,
      _centroidLng: district.centroidLng,
    });
  }

  console.info("Seeding demo users (password: ChangeMe!Dev1)…");
  const passwordHash = bcrypt.hashSync("ChangeMe!Dev1", 10);
  const wpProvince = provinceByCode.get("WP");

  await prisma.user.upsert({
    where: { email: "hq.admin@police.lk" },
    create: {
      email: "hq.admin@police.lk",
      passwordHash,
      role: UserRole.HQ_ADMIN,
    },
    update: { passwordHash, role: UserRole.HQ_ADMIN },
  });

  await prisma.user.upsert({
    where: { email: "western.provincial@police.lk" },
    create: {
      email: "western.provincial@police.lk",
      passwordHash,
      role: UserRole.PROVINCIAL,
      provinceId: wpProvince.id,
    },
    update: { passwordHash, role: UserRole.PROVINCIAL, provinceId: wpProvince.id },
  });

  const fort = stationByCode.get("COL-FT");
  await prisma.user.upsert({
    where: { email: "colombo.fort@police.lk" },
    create: {
      email: "colombo.fort@police.lk",
      passwordHash,
      role: UserRole.STATION,
      stationId: fort.id,
    },
    update: { passwordHash, role: UserRole.STATION, stationId: fort.id },
  });

  console.info("Clearing vehicles, devices, pings (re-seed safe)…");
  await prisma.locationPing.deleteMany();
  await prisma.trackerDevice.deleteMany();
  await prisma.vehicle.deleteMany();

  console.info("Seeding 200 vehicles + devices…");
  const districtCodes = DISTRICTS.map((d) => d.code);
  const stationsList = [...stationByCode.values()];
  const vehicles = [];

  for (let i = 0; i < 200; i += 1) {
    const dcode = districtCodes[i % districtCodes.length];
    const district = districtByCode.get(dcode);
    const stationCandidate = stationsList.filter((s) => s.districtId === district.id);
    const station = stationCandidate[i % stationCandidate.length];
    const reg = `SL-${dcode}-${String(i + 1).padStart(4, "0")}`;
    const status =
      i % 17 === 0
        ? VehicleStatus.INACTIVE
        : i % 29 === 0
          ? VehicleStatus.SUSPENDED
          : VehicleStatus.ACTIVE;

    vehicles.push({
      registrationNumber: reg,
      status,
      districtId: district.id,
      stationId: station.id,
      driverName: `Driver ${i + 1}`,
      driverLicense: `B-${String(100000 + i)}`,
      _meta: { index: i, district, station },
    });
  }

  const createdVehicles = [];
  for (const v of vehicles) {
    const { _meta, ...data } = v;
    const created = await prisma.vehicle.create({ data });
    createdVehicles.push({ ...created, _meta });
    const plainKey = `dev-device-${created.id.slice(0, 8)}`;
    await prisma.trackerDevice.create({
      data: {
        vehicleId: created.id,
        apiKeyHash: bcrypt.hashSync(plainKey, 10),
        label: `Tracker ${_meta.index + 1}`,
      },
    });
    if (_meta.index < 3) {
      console.info(
        `  Sample device API key (save for Week 3+ demos): ${plainKey} → vehicle ${created.registrationNumber}`,
      );
    }
  }

  console.info("Seeding ~8 days of location pings (30 min, 06:00–22:00 SL)…");
  const chunk = [];
  const chunkSize = 2000;
  let total = 0;
  for (const cv of createdVehicles) {
    const row = cv._meta;
    const pings = buildPingsForVehicle(row.index, row.district, row.station, cv.id, 8);
    for (const p of pings) {
      chunk.push(p);
      if (chunk.length >= chunkSize) {
        await prisma.locationPing.createMany({ data: chunk });
        total += chunk.length;
        chunk.length = 0;
      }
    }
  }
  if (chunk.length) {
    await prisma.locationPing.createMany({ data: chunk });
    total += chunk.length;
  }
  console.info(`Inserted ${total} location pings.`);

  console.info("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
