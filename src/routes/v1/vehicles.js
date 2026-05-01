import { Router } from "express";
import {
  District,
  LocationPing,
  PoliceStation,
  Province,
  TrackerDevice,
  Vehicle,
} from "../../models/index.js";
import { createHttpError } from "../../middleware/error-handler.js";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { parseDateRange, parseObjectId, parsePagination } from "../../services/query-utils.js";

const router = Router();
const ALLOWED_STATUSES = new Set(["ACTIVE", "INACTIVE", "SUSPENDED"]);
router.use(requireAuth);

async function getAllowedVehicleIdsForScope(auth) {
  if (auth.role === "HQ_ADMIN") return null;
  if (auth.role === "STATION") {
    const stationId = parseObjectId(auth.stationId, "stationId", true);
    const vehicles = await Vehicle.find({ stationId }).select("_id").lean();
    return vehicles.map((v) => v._id);
  }
  if (auth.role === "PROVINCIAL") {
    const provinceId = parseObjectId(auth.provinceId, "provinceId", true);
    const districts = await District.find({ provinceId }).select("_id").lean();
    const districtIds = districts.map((d) => d._id);
    const vehicles = await Vehicle.find({ districtId: { $in: districtIds } })
      .select("_id")
      .lean();
    return vehicles.map((v) => v._id);
  }
  throw createHttpError(403, "FORBIDDEN", "Unknown role.");
}

async function scopeVehicleMatch(baseMatch, auth) {
  const scopedIds = await getAllowedVehicleIdsForScope(auth);
  if (!scopedIds) return baseMatch;
  return { ...baseMatch, _id: { $in: scopedIds } };
}

function mapVehicleDoc(vehicle) {
  return {
    ...vehicle,
    id: String(vehicle._id),
    districtId: vehicle.districtId?._id
      ? String(vehicle.districtId._id)
      : String(vehicle.districtId),
    stationId: vehicle.stationId?._id
      ? String(vehicle.stationId._id)
      : vehicle.stationId
        ? String(vehicle.stationId)
        : null,
    district: vehicle.districtId?._id
      ? {
          id: String(vehicle.districtId._id),
          code: vehicle.districtId.code,
          name: vehicle.districtId.name,
          province: vehicle.districtId.provinceId?._id
            ? {
                id: String(vehicle.districtId.provinceId._id),
                code: vehicle.districtId.provinceId.code,
                name: vehicle.districtId.provinceId.name,
              }
            : null,
        }
      : undefined,
    station: vehicle.stationId?._id
      ? {
          id: String(vehicle.stationId._id),
          code: vehicle.stationId.code,
          name: vehicle.stationId.name,
        }
      : null,
  };
}

router.get("/vehicles", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const match = {};
    if (req.query.status) {
      const normalized = req.query.status.toUpperCase();
      if (!ALLOWED_STATUSES.has(normalized)) {
        throw createHttpError(
          400,
          "VALIDATION_ERROR",
          "`status` must be ACTIVE, INACTIVE, or SUSPENDED.",
        );
      }
      match.status = normalized;
    }
    if (req.query.stationId) match.stationId = parseObjectId(req.query.stationId, "stationId");
    if (req.query.districtId) match.districtId = parseObjectId(req.query.districtId, "districtId");
    if (req.query.q) {
      match.$or = [
        { registrationNumber: { $regex: req.query.q, $options: "i" } },
        { driverName: { $regex: req.query.q, $options: "i" } },
      ];
    }
    if (req.query.stationCode) {
      const station = await PoliceStation.findOne({ code: req.query.stationCode.toUpperCase() })
        .select("_id")
        .lean();
      match.stationId = station?._id || null;
    }
    if (req.query.districtCode) {
      const district = await District.findOne({ code: req.query.districtCode.toUpperCase() })
        .select("_id")
        .lean();
      match.districtId = district?._id || null;
    }
    if (req.query.provinceId || req.query.provinceCode) {
      const districtMatch = {};
      if (req.query.provinceId)
        districtMatch.provinceId = parseObjectId(req.query.provinceId, "provinceId");
      if (req.query.provinceCode) {
        const province = await Province.findOne({ code: req.query.provinceCode.toUpperCase() })
          .select("_id")
          .lean();
        districtMatch.provinceId = province?._id || null;
      }
      const districts = await District.find(districtMatch).select("_id").lean();
      match.districtId = { $in: districts.map((d) => d._id) };
    }

    const scopedMatch = await scopeVehicleMatch(match, req.auth);
    const [items, total] = await Promise.all([
      Vehicle.find(scopedMatch)
        .populate({ path: "districtId", populate: { path: "provinceId", model: "Province" } })
        .populate("stationId")
        .sort({ registrationNumber: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Vehicle.countDocuments(scopedMatch),
    ]);
    res.json({
      data: items.map(mapVehicleDoc),
      page: pagination.page,
      limit: pagination.limit,
      total,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/vehicles/:vehicleId", async (req, res, next) => {
  try {
    const vehicleId = parseObjectId(req.params.vehicleId, "vehicleId", true);
    const scopedMatch = await scopeVehicleMatch({ _id: vehicleId }, req.auth);
    const vehicle = await Vehicle.findOne(scopedMatch)
      .populate({ path: "districtId", populate: { path: "provinceId", model: "Province" } })
      .populate("stationId")
      .lean();
    if (!vehicle) throw createHttpError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
    const devices = await TrackerDevice.find({ vehicleId })
      .select("_id label isActive lastSeenAt")
      .lean();
    res.json({
      data: {
        ...mapVehicleDoc(vehicle),
        devices: devices.map((d) => ({ ...d, id: String(d._id) })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/vehicles/:vehicleId/location/latest", async (req, res, next) => {
  try {
    const vehicleId = parseObjectId(req.params.vehicleId, "vehicleId", true);
    const scopedMatch = await scopeVehicleMatch({ _id: vehicleId }, req.auth);
    const vehicle = await Vehicle.findOne(scopedMatch).select("_id registrationNumber").lean();
    if (!vehicle) throw createHttpError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
    const latest = await LocationPing.findOne({ vehicleId }).sort({ recordedAt: -1 }).lean();
    if (!latest)
      throw createHttpError(404, "LOCATION_NOT_FOUND", "No location pings found for this vehicle.");
    res.json({
      data: {
        vehicle: { id: String(vehicle._id), registrationNumber: vehicle.registrationNumber },
        latest: { ...latest, id: String(latest._id), vehicleId: String(latest.vehicleId) },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/vehicles/:vehicleId/locations", async (req, res, next) => {
  try {
    const vehicleId = parseObjectId(req.params.vehicleId, "vehicleId", true);
    const scopedMatch = await scopeVehicleMatch({ _id: vehicleId }, req.auth);
    const vehicle = await Vehicle.findOne(scopedMatch).select("_id registrationNumber").lean();
    if (!vehicle) throw createHttpError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
    const pagination = parsePagination(req.query);
    const { fromDate, toDate } = parseDateRange(req.query, 14);
    const pingMatch = { vehicleId, recordedAt: { $gte: fromDate, $lte: toDate } };
    const [points, total] = await Promise.all([
      LocationPing.find(pingMatch)
        .sort({ recordedAt: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      LocationPing.countDocuments(pingMatch),
    ]);
    res.json({
      data: {
        vehicle: { id: String(vehicle._id), registrationNumber: vehicle.registrationNumber },
        range: { from: fromDate.toISOString(), to: toDate.toISOString() },
        points: points.map((p) => ({ ...p, id: String(p._id), vehicleId: String(p.vehicleId) })),
      },
      page: pagination.page,
      limit: pagination.limit,
      total,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/vehicles", requireRoles("HQ_ADMIN", "PROVINCIAL"), async (req, res, next) => {
  try {
    const {
      registrationNumber,
      districtId,
      stationId = null,
      status = "ACTIVE",
      driverName = null,
      driverLicense = null,
    } = req.body ?? {};
    if (!registrationNumber || !districtId) {
      throw createHttpError(
        400,
        "VALIDATION_ERROR",
        "`registrationNumber` and `districtId` are required.",
      );
    }
    const normalizedStatus = String(status).toUpperCase();
    if (!ALLOWED_STATUSES.has(normalizedStatus))
      throw createHttpError(400, "VALIDATION_ERROR", "Invalid vehicle status.");
    const districtObjectId = parseObjectId(districtId, "districtId", true);
    const district = await District.findById(districtObjectId).select("_id provinceId").lean();
    if (!district) throw createHttpError(404, "DISTRICT_NOT_FOUND", "District not found.");
    if (
      req.auth.role === "PROVINCIAL" &&
      String(district.provinceId) !== String(req.auth.provinceId)
    ) {
      throw createHttpError(403, "FORBIDDEN", "Cannot create vehicle outside your province.");
    }
    let stationObjectId = null;
    if (stationId) {
      stationObjectId = parseObjectId(stationId, "stationId", true);
      const station = await PoliceStation.findById(stationObjectId).select("districtId").lean();
      if (!station || String(station.districtId) !== String(district._id)) {
        throw createHttpError(
          400,
          "VALIDATION_ERROR",
          "`stationId` must belong to the selected district.",
        );
      }
    }
    const vehicle = await Vehicle.create({
      registrationNumber: registrationNumber.trim().toUpperCase(),
      districtId: districtObjectId,
      stationId: stationObjectId,
      status: normalizedStatus,
      driverName,
      driverLicense,
    });
    const created = await Vehicle.findById(vehicle._id)
      .populate({ path: "districtId", populate: { path: "provinceId", model: "Province" } })
      .populate("stationId")
      .lean();
    res.status(201).json({ data: mapVehicleDoc(created) });
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/vehicles/:vehicleId",
  requireRoles("HQ_ADMIN", "PROVINCIAL"),
  async (req, res, next) => {
    try {
      const vehicleId = parseObjectId(req.params.vehicleId, "vehicleId", true);
      const existing = await Vehicle.findById(vehicleId).lean();
      if (!existing) throw createHttpError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
      const existingDistrict = await District.findById(existing.districtId)
        .select("provinceId")
        .lean();
      if (
        req.auth.role === "PROVINCIAL" &&
        String(existingDistrict.provinceId) !== String(req.auth.provinceId)
      ) {
        throw createHttpError(403, "FORBIDDEN", "Cannot update vehicle outside your province.");
      }
      const patch = {};
      if (req.body.status) {
        const normalized = String(req.body.status).toUpperCase();
        if (!ALLOWED_STATUSES.has(normalized))
          throw createHttpError(400, "VALIDATION_ERROR", "Invalid vehicle status.");
        patch.status = normalized;
      }
      if (req.body.driverName !== undefined) patch.driverName = req.body.driverName;
      if (req.body.driverLicense !== undefined) patch.driverLicense = req.body.driverLicense;
      if (req.body.districtId !== undefined)
        patch.districtId = parseObjectId(req.body.districtId, "districtId", true);
      if (req.body.stationId !== undefined)
        patch.stationId = req.body.stationId
          ? parseObjectId(req.body.stationId, "stationId", true)
          : null;
      if (patch.districtId) {
        const district = await District.findById(patch.districtId).select("_id provinceId").lean();
        if (!district) throw createHttpError(404, "DISTRICT_NOT_FOUND", "District not found.");
        if (
          req.auth.role === "PROVINCIAL" &&
          String(district.provinceId) !== String(req.auth.provinceId)
        ) {
          throw createHttpError(403, "FORBIDDEN", "Cannot move vehicle outside your province.");
        }
        if (patch.stationId) {
          const station = await PoliceStation.findById(patch.stationId).select("districtId").lean();
          if (!station || String(station.districtId) !== String(district._id)) {
            throw createHttpError(
              400,
              "VALIDATION_ERROR",
              "stationId does not belong to districtId.",
            );
          }
        }
      }
      await Vehicle.findByIdAndUpdate(vehicleId, patch, { new: true });
      const updated = await Vehicle.findById(vehicleId)
        .populate({ path: "districtId", populate: { path: "provinceId", model: "Province" } })
        .populate("stationId")
        .lean();
      res.json({ data: mapVehicleDoc(updated) });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
