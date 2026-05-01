import { Router } from "express";
import { District, LocationPing, Vehicle } from "../../models/index.js";
import { createHttpError } from "../../middleware/error-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { parseObjectId } from "../../services/query-utils.js";

const router = Router();
router.use(requireAuth);

async function getScopedVehicleIds(auth) {
  if (auth.role === "HQ_ADMIN") return null;
  if (auth.role === "STATION") {
    const stationId = parseObjectId(auth.stationId, "stationId", true);
    const vehicles = await Vehicle.find({ stationId }).select("_id").lean();
    return vehicles.map((v) => v._id);
  }
  if (auth.role === "PROVINCIAL") {
    const provinceId = parseObjectId(auth.provinceId, "provinceId", true);
    const districts = await District.find({ provinceId }).select("_id").lean();
    const vehicles = await Vehicle.find({ districtId: { $in: districts.map((d) => d._id) } })
      .select("_id")
      .lean();
    return vehicles.map((v) => v._id);
  }
  throw createHttpError(403, "FORBIDDEN", "Unknown role.");
}

router.get("/analytics/vehicles-by-district", async (req, res, next) => {
  try {
    const scopedVehicleIds = await getScopedVehicleIds(req.auth);
    const match = { status: "ACTIVE" };
    if (scopedVehicleIds) match._id = { $in: scopedVehicleIds };
    const grouped = await Vehicle.aggregate([
      { $match: match },
      { $group: { _id: "$districtId", activeVehicles: { $sum: 1 } } },
      { $sort: { activeVehicles: -1 } },
    ]);
    const districtIds = grouped.map((g) => g._id);
    const districts = await District.find({ _id: { $in: districtIds } })
      .populate("provinceId", "code name")
      .lean();
    const districtById = new Map(districts.map((d) => [String(d._id), d]));
    res.json({
      data: grouped.map((row) => {
        const d = districtById.get(String(row._id));
        return {
          district: d
            ? {
                id: String(d._id),
                code: d.code,
                name: d.name,
                province: d.provinceId
                  ? {
                      id: String(d.provinceId._id),
                      code: d.provinceId.code,
                      name: d.provinceId.name,
                    }
                  : null,
              }
            : null,
          activeVehicles: row.activeVehicles,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/analytics/active-vehicles", async (req, res, next) => {
  try {
    const minutes = Number(req.query.minutes ?? 30);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 24 * 60) {
      throw createHttpError(
        400,
        "VALIDATION_ERROR",
        "`minutes` must be an integer between 1 and 1440.",
      );
    }

    const since = new Date(Date.now() - minutes * 60 * 1000);
    const scopedVehicleIds = await getScopedVehicleIds(req.auth);
    let vehicleMatch = {};
    if (scopedVehicleIds) vehicleMatch._id = { $in: scopedVehicleIds };
    if (req.query.districtId)
      vehicleMatch.districtId = parseObjectId(req.query.districtId, "districtId");
    if (req.query.stationId)
      vehicleMatch.stationId = parseObjectId(req.query.stationId, "stationId");
    if (req.query.provinceId) {
      const districts = await District.find({
        provinceId: parseObjectId(req.query.provinceId, "provinceId"),
      })
        .select("_id")
        .lean();
      vehicleMatch.districtId = { $in: districts.map((d) => d._id) };
    }
    const vehicleIds = (await Vehicle.find(vehicleMatch).select("_id").lean()).map((v) => v._id);
    const grouped = await LocationPing.aggregate([
      { $match: { vehicleId: { $in: vehicleIds }, recordedAt: { $gte: since } } },
      { $group: { _id: "$vehicleId", lastSeenAt: { $max: "$recordedAt" } } },
      { $sort: { lastSeenAt: -1 } },
    ]);
    const vehicles = await Vehicle.find({ _id: { $in: grouped.map((g) => g._id) } })
      .populate("districtId", "code name")
      .populate("stationId", "code name")
      .lean();
    const vehicleById = new Map(vehicles.map((v) => [String(v._id), v]));
    res.json({
      data: grouped.map((item) => ({
        vehicle: (() => {
          const v = vehicleById.get(String(item._id));
          if (!v) return null;
          return {
            id: String(v._id),
            registrationNumber: v.registrationNumber,
            status: v.status,
            district: v.districtId
              ? { id: String(v.districtId._id), code: v.districtId.code, name: v.districtId.name }
              : null,
            station: v.stationId
              ? { id: String(v.stationId._id), code: v.stationId.code, name: v.stationId.name }
              : null,
          };
        })(),
        lastSeenAt: item.lastSeenAt,
      })),
      minutesWindow: minutes,
      since: since.toISOString(),
      total: grouped.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
