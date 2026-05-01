import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { ROLES } from "../src/constants/roles.js";

dotenv.config();
const prisma = new PrismaClient();

const readJson = async (relativePath) => {
  const full = path.resolve(relativePath);
  const text = await fs.readFile(full, "utf-8");
  return JSON.parse(text);
};

const run = async () => {
  const master = await readJson("data/generated/master-data.json");
  const sim = await readJson("data/generated/sim-seed-sample.json");

  await prisma.locationPing.deleteMany();
  await prisma.user.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.policeStation.deleteMany();
  await prisma.district.deleteMany();
  await prisma.province.deleteMany();

  const provinceMap = new Map();
  for (const p of master.provinces) {
    const created = await prisma.province.create({ data: p });
    provinceMap.set(p.code, created.id);
  }

  const districtMap = new Map();
  for (const d of master.districts) {
    const created = await prisma.district.create({
      data: {
        name: d.name,
        code: d.code,
        provinceId: provinceMap.get(d.provinceCode)
      }
    });
    districtMap.set(d.code, created.id);
  }

  const stationMap = new Map();
  for (const s of master.stations) {
    const created = await prisma.policeStation.create({
      data: {
        name: s.name,
        code: s.code,
        districtId: districtMap.get(s.districtCode),
        lat: s.lat,
        lng: s.lng
      }
    });
    stationMap.set(s.code, created.id);
  }

  const vehicleMap = new Map();
  for (const v of sim.vehicles) {
    const created = await prisma.vehicle.create({
      data: {
        regNumber: v.regNumber,
        deviceId: v.deviceId,
        driverName: v.driverName,
        status: v.status,
        currentDistrictId: districtMap.get(v.districtCode)
      }
    });
    vehicleMap.set(v.regNumber, created.id);
  }

  for (const pingGroup of sim.pings) {
    const vehicleId = vehicleMap.get(pingGroup.regNumber);
    const data = pingGroup.points.map((point) => ({
      vehicleId,
      lat: point.lat,
      lng: point.lng,
      speed: point.speed,
      heading: point.heading,
      timestamp: new Date(point.timestamp)
    }));
    if (data.length > 0) await prisma.locationPing.createMany({ data });
  }

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const firstProvinceId = Array.from(provinceMap.values())[0];
  const firstStationId = Array.from(stationMap.values())[0];
  const firstVehicleId = Array.from(vehicleMap.values())[0];

  await prisma.user.createMany({
    data: [
      {
        name: "HQ Admin",
        email: "hq.admin@example.com",
        passwordHash,
        role: ROLES.HQ_ADMIN
      },
      {
        name: "Provincial Admin",
        email: "prov.admin@example.com",
        passwordHash,
        role: ROLES.PROVINCIAL_ADMIN,
        provinceId: firstProvinceId
      },
      {
        name: "Station User",
        email: "station.user@example.com",
        passwordHash,
        role: ROLES.STATION_USER,
        stationId: firstStationId
      },
      {
        name: "Device Client",
        email: "device.client@example.com",
        passwordHash,
        role: ROLES.DEVICE_CLIENT,
        vehicleId: firstVehicleId
      }
    ]
  });

  console.log("Postgres seeded successfully");
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
