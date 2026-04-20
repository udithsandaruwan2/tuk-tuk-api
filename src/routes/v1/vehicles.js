import { Router } from "express";
import { prisma } from "../../services/prisma.js";
import { createHttpError } from "../../middleware/error-handler.js";
import { parseDateRange, parsePagination } from "../../services/query-utils.js";

const router = Router();
const ALLOWED_STATUSES = new Set(["ACTIVE", "INACTIVE", "SUSPENDED"]);

router.get("/vehicles", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const and = [];
    if (req.query.status) {
      const normalized = req.query.status.toUpperCase();
      if (!ALLOWED_STATUSES.has(normalized)) {
        throw createHttpError(
          400,
          "VALIDATION_ERROR",
          "`status` must be one of ACTIVE, INACTIVE, SUSPENDED.",
        );
      }
      and.push({ status: normalized });
    }
    if (req.query.stationId) and.push({ stationId: req.query.stationId });
    if (req.query.stationCode) and.push({ station: { code: req.query.stationCode.toUpperCase() } });
    if (req.query.districtId) and.push({ districtId: req.query.districtId });
    if (req.query.districtCode)
      and.push({ district: { code: req.query.districtCode.toUpperCase() } });
    if (req.query.provinceId) and.push({ district: { provinceId: req.query.provinceId } });
    if (req.query.provinceCode) {
      and.push({ district: { province: { code: req.query.provinceCode.toUpperCase() } } });
    }
    if (req.query.q) {
      and.push({
        OR: [
          { registrationNumber: { contains: req.query.q, mode: "insensitive" } },
          { driverName: { contains: req.query.q, mode: "insensitive" } },
        ],
      });
    }
    const where = and.length ? { AND: and } : {};

    const [items, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: {
          district: {
            select: {
              id: true,
              code: true,
              name: true,
              province: { select: { id: true, code: true, name: true } },
            },
          },
          station: { select: { id: true, code: true, name: true } },
        },
        orderBy: { registrationNumber: "asc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.vehicle.count({ where }),
    ]);

    res.json({
      data: items,
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
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.vehicleId },
      include: {
        district: {
          select: {
            id: true,
            code: true,
            name: true,
            province: { select: { id: true, code: true, name: true } },
          },
        },
        station: { select: { id: true, code: true, name: true } },
        devices: { select: { id: true, label: true, isActive: true, lastSeenAt: true } },
      },
    });

    if (!vehicle) {
      throw createHttpError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
    }

    res.json({ data: vehicle });
  } catch (error) {
    next(error);
  }
});

router.get("/vehicles/:vehicleId/location/latest", async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.vehicleId },
      select: { id: true, registrationNumber: true },
    });
    if (!vehicle) {
      throw createHttpError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
    }

    const latest = await prisma.locationPing.findFirst({
      where: { vehicleId: req.params.vehicleId },
      orderBy: { recordedAt: "desc" },
    });

    if (!latest) {
      throw createHttpError(404, "LOCATION_NOT_FOUND", "No location pings found for this vehicle.");
    }

    res.json({ data: { vehicle, latest } });
  } catch (error) {
    next(error);
  }
});

router.get("/vehicles/:vehicleId/locations", async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.vehicleId },
      select: { id: true, registrationNumber: true },
    });
    if (!vehicle) {
      throw createHttpError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
    }

    const pagination = parsePagination(req.query);
    const { fromDate, toDate } = parseDateRange(req.query, 14);

    const where = {
      vehicleId: req.params.vehicleId,
      recordedAt: {
        gte: fromDate,
        lte: toDate,
      },
    };

    const [items, total] = await Promise.all([
      prisma.locationPing.findMany({
        where,
        orderBy: { recordedAt: "asc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.locationPing.count({ where }),
    ]);

    res.json({
      data: {
        vehicle,
        range: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        },
        points: items,
      },
      page: pagination.page,
      limit: pagination.limit,
      total,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
