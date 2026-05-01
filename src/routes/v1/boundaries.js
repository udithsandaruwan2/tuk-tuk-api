import { Router } from "express";
import { District, PoliceStation, Province } from "../../models/index.js";
import { requireAuth } from "../../middleware/auth.js";
import { createHttpError } from "../../middleware/error-handler.js";
import { parseObjectId, parsePagination } from "../../services/query-utils.js";

const router = Router();
router.use(requireAuth);

function scopeFromAuth(auth) {
  if (auth.role === "HQ_ADMIN") return {};
  if (auth.role === "PROVINCIAL")
    return { provinceId: parseObjectId(auth.provinceId, "provinceId", true) };
  if (auth.role === "STATION")
    return { stationId: parseObjectId(auth.stationId, "stationId", true) };
  throw createHttpError(403, "FORBIDDEN", "Unknown role.");
}

router.get("/provinces", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const authScope = scopeFromAuth(req.auth);
    const match = {};
    if (req.query.q) {
      match.$or = [
        { name: { $regex: req.query.q, $options: "i" } },
        { code: { $regex: req.query.q.toUpperCase(), $options: "i" } },
      ];
    }
    if (authScope.provinceId) match._id = authScope.provinceId;
    if (req.query.provinceId) match._id = parseObjectId(req.query.provinceId, "provinceId");
    if (req.query.provinceCode) match.code = req.query.provinceCode.toUpperCase();

    const [items, total] = await Promise.all([
      Province.find(match).sort({ name: 1 }).skip(pagination.skip).limit(pagination.limit).lean(),
      Province.countDocuments(match),
    ]);
    res.json({ data: items, page: pagination.page, limit: pagination.limit, total });
  } catch (error) {
    next(error);
  }
});

router.get("/districts", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const authScope = scopeFromAuth(req.auth);
    const match = {};

    if (authScope.provinceId) {
      match.provinceId = authScope.provinceId;
    } else if (authScope.stationId) {
      const station = await PoliceStation.findById(authScope.stationId).select("districtId").lean();
      if (station) match._id = station.districtId;
    }

    if (req.query.provinceId) match.provinceId = parseObjectId(req.query.provinceId, "provinceId");
    if (req.query.provinceCode) {
      const province = await Province.findOne({ code: req.query.provinceCode.toUpperCase() })
        .select("_id")
        .lean();
      match.provinceId = province?._id || null;
    }
    if (req.query.q) {
      match.$or = [
        { name: { $regex: req.query.q, $options: "i" } },
        { code: { $regex: req.query.q.toUpperCase(), $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      District.find(match)
        .populate("provinceId", "code name")
        .sort({ name: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      District.countDocuments(match),
    ]);
    const data = items.map((d) => ({
      ...d,
      id: String(d._id),
      province: d.provinceId
        ? { id: String(d.provinceId._id), code: d.provinceId.code, name: d.provinceId.name }
        : null,
      provinceId: d.provinceId?._id ? String(d.provinceId._id) : String(d.provinceId),
    }));
    res.json({ data, page: pagination.page, limit: pagination.limit, total });
  } catch (error) {
    next(error);
  }
});

router.get("/stations", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const authScope = scopeFromAuth(req.auth);
    const match = {};
    if (authScope.stationId) match._id = authScope.stationId;
    if (req.query.districtId) match.districtId = parseObjectId(req.query.districtId, "districtId");
    if (req.query.q) match.name = { $regex: req.query.q, $options: "i" };

    if (
      req.query.districtCode ||
      req.query.provinceId ||
      req.query.provinceCode ||
      authScope.provinceId
    ) {
      const districtMatch = {};
      if (req.query.districtCode) districtMatch.code = req.query.districtCode.toUpperCase();
      if (req.query.provinceId)
        districtMatch.provinceId = parseObjectId(req.query.provinceId, "provinceId");
      if (req.query.provinceCode) {
        const province = await Province.findOne({ code: req.query.provinceCode.toUpperCase() })
          .select("_id")
          .lean();
        districtMatch.provinceId = province?._id || null;
      }
      if (authScope.provinceId) districtMatch.provinceId = authScope.provinceId;
      const districts = await District.find(districtMatch).select("_id").lean();
      match.districtId = { $in: districts.map((d) => d._id) };
    }

    const [items, total] = await Promise.all([
      PoliceStation.find(match)
        .populate({ path: "districtId", populate: { path: "provinceId", model: "Province" } })
        .sort({ name: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      PoliceStation.countDocuments(match),
    ]);

    const data = items.map((s) => ({
      ...s,
      id: String(s._id),
      districtId: s.districtId?._id ? String(s.districtId._id) : String(s.districtId),
      district: s.districtId
        ? {
            id: String(s.districtId._id),
            code: s.districtId.code,
            name: s.districtId.name,
            province: s.districtId.provinceId
              ? {
                  id: String(s.districtId.provinceId._id),
                  code: s.districtId.provinceId.code,
                  name: s.districtId.provinceId.name,
                }
              : null,
          }
        : null,
    }));
    res.json({ data, page: pagination.page, limit: pagination.limit, total });
  } catch (error) {
    next(error);
  }
});

router.get("/districts/:districtId/stations", async (req, res, next) => {
  try {
    const districtId = parseObjectId(req.params.districtId, "districtId", true);
    const district = await District.findById(districtId).lean();
    if (!district) throw createHttpError(404, "DISTRICT_NOT_FOUND", "District not found.");
    const stations = await PoliceStation.find({ districtId }).sort({ name: 1 }).lean();
    res.json({ data: stations });
  } catch (error) {
    next(error);
  }
});

export default router;
