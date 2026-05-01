import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../src/services/db.js";
import {
  District,
  LocationPing,
  PoliceStation,
  Province,
  TrackerDevice,
  User,
  Vehicle,
} from "../src/models/index.js";

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

export async function seedMongoData() {
  await Promise.all([
    LocationPing.deleteMany({}),
    TrackerDevice.deleteMany({}),
    Vehicle.deleteMany({}),
    User.deleteMany({}),
    PoliceStation.deleteMany({}),
    District.deleteMany({}),
    Province.deleteMany({}),
  ]);

  const provinces = await Province.insertMany(PROVINCES);
  const provinceByCode = new Map(provinces.map((p) => [p.code, p]));
  const districts = await District.insertMany(
    DISTRICTS.map((d) => ({
      code: d.code,
      name: d.name,
      provinceId: provinceByCode.get(d.provinceCode)._id,
    })),
  );
  const districtByCode = new Map(districts.map((d) => [d.code, d]));
  const stations = await PoliceStation.insertMany(
    STATIONS.map((s) => ({
      code: s.code,
      name: s.name,
      districtId: districtByCode.get(s.districtCode)._id,
    })),
  );
  const stationByDistrict = new Map();
  for (const s of stations) {
    const key = String(s.districtId);
    if (!stationByDistrict.has(key)) stationByDistrict.set(key, []);
    stationByDistrict.get(key).push(s);
  }

  const passwordHash = await bcrypt.hash("ChangeMe!Dev1", 10);
  const wp = provinceByCode.get("WP");
  const fort = stations.find((s) => s.code === "COL-FT");
  await User.insertMany([
    { email: "hq.admin@police.lk", passwordHash, role: "HQ_ADMIN" },
    { email: "western.provincial@police.lk", passwordHash, role: "PROVINCIAL", provinceId: wp._id },
    { email: "colombo.fort@police.lk", passwordHash, role: "STATION", stationId: fort._id },
  ]);

  const vehicles = [];
  const districtList = [...districts];
  for (let i = 0; i < 200; i += 1) {
    const district = districtList[i % districtList.length];
    const options = stationByDistrict.get(String(district._id));
    const station = options[i % options.length];
    const status = i % 17 === 0 ? "INACTIVE" : i % 29 === 0 ? "SUSPENDED" : "ACTIVE";
    vehicles.push({
      registrationNumber: `SL-${district.code}-${String(i + 1).padStart(4, "0")}`,
      status,
      districtId: district._id,
      stationId: station._id,
      driverName: `Driver ${i + 1}`,
      driverLicense: `B-${String(100000 + i)}`,
    });
  }
  const insertedVehicles = await Vehicle.insertMany(vehicles);

  const deviceDocs = [];
  for (let i = 0; i < insertedVehicles.length; i += 1) {
    const v = insertedVehicles[i];
    const plain = `dev-device-${String(v._id).slice(-8)}`;
    deviceDocs.push({
      vehicleId: v._id,
      apiKeyHash: await bcrypt.hash(plain, 10),
      label: `Tracker ${i + 1}`,
      isActive: true,
    });
    if (i < 3) console.info(`Sample key: ${plain} -> ${v.registrationNumber}`);
  }
  await TrackerDevice.insertMany(deviceDocs);

  const now = Date.now();
  const pings = [];
  for (let i = 0; i < insertedVehicles.length; i += 1) {
    const v = insertedVehicles[i];
    const d = DISTRICTS[i % DISTRICTS.length];
    for (let day = 0; day < 8; day += 1) {
      for (let hour = 6; hour <= 22; hour += 1) {
        for (const minute of [0, 30]) {
          if (hour === 22 && minute === 30) continue;
          const recordedAt = new Date(
            now - (8 - day) * 24 * 60 * 60 * 1000 + (hour * 60 + minute) * 60 * 1000,
          );
          pings.push({
            vehicleId: v._id,
            recordedAt,
            latitude: Number((d.lat + ((i % 10) - 5) * 0.001).toFixed(6)),
            longitude: Number((d.lng + ((i % 8) - 4) * 0.001).toFixed(6)),
            speedKmh: 10 + (i % 20),
            headingDeg: (i * 17) % 360,
          });
        }
      }
    }
  }
  await LocationPing.insertMany(pings, { ordered: false });
  console.info(`Seeded MongoDB successfully. Pings inserted: ${pings.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  connectDatabase()
    .then(seedMongoData)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await disconnectDatabase();
    });
}
