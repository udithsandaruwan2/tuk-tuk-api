import fs from "node:fs/promises";
import path from "node:path";

const provinces = [
  { name: "Western", code: "LK-1" },
  { name: "Central", code: "LK-2" },
  { name: "Southern", code: "LK-3" },
  { name: "Northern", code: "LK-4" },
  { name: "Eastern", code: "LK-5" },
  { name: "North Western", code: "LK-6" },
  { name: "North Central", code: "LK-7" },
  { name: "Uva", code: "LK-8" },
  { name: "Sabaragamuwa", code: "LK-9" }
];

const districts = [
  ["Colombo", "COL", "LK-1"],
  ["Gampaha", "GAM", "LK-1"],
  ["Kalutara", "KAL", "LK-1"],
  ["Kandy", "KAN", "LK-2"],
  ["Matale", "MAT", "LK-2"],
  ["Nuwara Eliya", "NUE", "LK-2"],
  ["Galle", "GAL", "LK-3"],
  ["Matara", "MTR", "LK-3"],
  ["Hambantota", "HAM", "LK-3"],
  ["Jaffna", "JAF", "LK-4"],
  ["Kilinochchi", "KIL", "LK-4"],
  ["Mannar", "MAN", "LK-4"],
  ["Mullaitivu", "MUL", "LK-4"],
  ["Vavuniya", "VAV", "LK-4"],
  ["Batticaloa", "BAT", "LK-5"],
  ["Ampara", "AMP", "LK-5"],
  ["Trincomalee", "TRI", "LK-5"],
  ["Kurunegala", "KUR", "LK-6"],
  ["Puttalam", "PUT", "LK-6"],
  ["Anuradhapura", "ANU", "LK-7"],
  ["Polonnaruwa", "POL", "LK-7"],
  ["Badulla", "BAD", "LK-8"],
  ["Monaragala", "MON", "LK-8"],
  ["Ratnapura", "RAT", "LK-9"],
  ["Kegalle", "KEG", "LK-9"]
].map(([name, code, provinceCode]) => ({ name, code, provinceCode }));

const stations = [
  ["Colombo Fort", "ST-COL-01", "COL", 6.9342, 79.8428],
  ["Wellawatte", "ST-COL-02", "COL", 6.8758, 79.8592],
  ["Negombo", "ST-GAM-01", "GAM", 7.2084, 79.8358],
  ["Gampaha Town", "ST-GAM-02", "GAM", 7.0873, 79.9992],
  ["Kalutara South", "ST-KAL-01", "KAL", 6.5854, 79.9607],
  ["Kandy", "ST-KAN-01", "KAN", 7.2906, 80.6337],
  ["Nuwara Eliya", "ST-NUE-01", "NUE", 6.9497, 80.7891],
  ["Galle Central", "ST-GAL-01", "GAL", 6.032, 80.2168],
  ["Matara", "ST-MTR-01", "MTR", 5.9549, 80.5549],
  ["Jaffna", "ST-JAF-01", "JAF", 9.6615, 80.0255],
  ["Batticaloa", "ST-BAT-01", "BAT", 7.717, 81.7003],
  ["Ampara", "ST-AMP-01", "AMP", 7.2917, 81.6747],
  ["Trincomalee", "ST-TRI-01", "TRI", 8.5874, 81.2152],
  ["Kurunegala", "ST-KUR-01", "KUR", 7.4863, 80.3647],
  ["Puttalam", "ST-PUT-01", "PUT", 8.0329, 79.8283],
  ["Anuradhapura", "ST-ANU-01", "ANU", 8.3114, 80.4037],
  ["Polonnaruwa", "ST-POL-01", "POL", 7.9403, 81.0188],
  ["Badulla", "ST-BAD-01", "BAD", 6.9934, 81.055],
  ["Monaragala", "ST-MON-01", "MON", 6.8728, 81.3497],
  ["Ratnapura", "ST-RAT-01", "RAT", 6.6828, 80.3992],
  ["Kegalle", "ST-KEG-01", "KEG", 7.2513, 80.3464]
].map(([name, code, districtCode, lat, lng]) => ({ name, code, districtCode, lat, lng }));

const output = { provinces, districts, stations };
const outputPath = path.resolve("data/generated/master-data.json");

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
console.log(`Master data generated at ${outputPath}`);
