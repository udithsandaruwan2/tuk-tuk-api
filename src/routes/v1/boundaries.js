import { Router } from "express";
import { prisma } from "../../services/prisma.js";
import { parsePagination } from "../../services/query-utils.js";
import { createHttpError } from "../../middleware/error-handler.js";

const router = Router();

router.get("/provinces", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const where = req.query.q
      ? {
          OR: [
            { name: { contains: req.query.q, mode: "insensitive" } },
            { code: { contains: req.query.q.toUpperCase() } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.province.findMany({
        where,
        orderBy: { name: "asc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.province.count({ where }),
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

router.get("/districts", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const and = [];
    if (req.query.provinceId) and.push({ provinceId: req.query.provinceId });
    if (req.query.provinceCode)
      and.push({ province: { code: req.query.provinceCode.toUpperCase() } });
    if (req.query.q) {
      and.push({
        OR: [
          { name: { contains: req.query.q, mode: "insensitive" } },
          { code: { contains: req.query.q.toUpperCase() } },
        ],
      });
    }
    const where = and.length ? { AND: and } : {};

    const [items, total] = await Promise.all([
      prisma.district.findMany({
        where,
        include: { province: { select: { id: true, code: true, name: true } } },
        orderBy: { name: "asc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.district.count({ where }),
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

router.get("/stations", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const and = [];
    if (req.query.districtId) and.push({ districtId: req.query.districtId });
    if (req.query.districtCode)
      and.push({ district: { code: req.query.districtCode.toUpperCase() } });
    if (req.query.provinceId) and.push({ district: { provinceId: req.query.provinceId } });
    if (req.query.provinceCode) {
      and.push({ district: { province: { code: req.query.provinceCode.toUpperCase() } } });
    }
    if (req.query.q) and.push({ name: { contains: req.query.q, mode: "insensitive" } });
    const where = and.length ? { AND: and } : {};

    const [items, total] = await Promise.all([
      prisma.policeStation.findMany({
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
        },
        orderBy: { name: "asc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.policeStation.count({ where }),
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

router.get("/districts/:districtId/stations", async (req, res, next) => {
  try {
    const district = await prisma.district.findUnique({
      where: { id: req.params.districtId },
      select: { id: true },
    });
    if (!district) {
      throw createHttpError(404, "DISTRICT_NOT_FOUND", "District not found.");
    }

    const stations = await prisma.policeStation.findMany({
      where: { districtId: req.params.districtId },
      orderBy: { name: "asc" },
    });
    res.json({ data: stations });
  } catch (error) {
    next(error);
  }
});

export default router;
