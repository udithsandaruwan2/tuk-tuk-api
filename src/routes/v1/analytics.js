import { Router } from "express";
import { prisma } from "../../services/prisma.js";
import { createHttpError } from "../../middleware/error-handler.js";

const router = Router();

router.get("/analytics/vehicles-by-district", async (_req, res, next) => {
  try {
    const rows = await prisma.vehicle.groupBy({
      by: ["districtId"],
      _count: { districtId: true },
      where: { status: "ACTIVE" },
      orderBy: { _count: { districtId: "desc" } },
    });

    const districts = await prisma.district.findMany({
      where: { id: { in: rows.map((r) => r.districtId) } },
      select: {
        id: true,
        code: true,
        name: true,
        province: { select: { id: true, code: true, name: true } },
      },
    });
    const districtById = new Map(districts.map((d) => [d.id, d]));

    res.json({
      data: rows.map((row) => ({
        district: districtById.get(row.districtId),
        activeVehicles: row._count.districtId,
      })),
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
    const and = [{ recordedAt: { gte: since } }];
    if (req.query.districtId) and.push({ vehicle: { districtId: req.query.districtId } });
    if (req.query.stationId) and.push({ vehicle: { stationId: req.query.stationId } });
    if (req.query.provinceId)
      and.push({ vehicle: { district: { provinceId: req.query.provinceId } } });
    const where = { AND: and };

    const grouped = await prisma.locationPing.groupBy({
      by: ["vehicleId"],
      where,
      _max: { recordedAt: true },
      orderBy: { _max: { recordedAt: "desc" } },
    });

    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: grouped.map((g) => g.vehicleId) } },
      select: {
        id: true,
        registrationNumber: true,
        status: true,
        district: { select: { id: true, code: true, name: true } },
        station: { select: { id: true, code: true, name: true } },
      },
    });
    const vehicleById = new Map(vehicles.map((v) => [v.id, v]));

    res.json({
      data: grouped.map((item) => ({
        vehicle: vehicleById.get(item.vehicleId),
        lastSeenAt: item._max.recordedAt,
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
