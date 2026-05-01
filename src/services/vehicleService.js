import { prisma } from "../config/db.js";

const listVehicles = async ({ districtId, status, page, limit }) => {
  const where = {};
  if (status) where.status = status;
  if (districtId) where.currentDistrictId = districtId;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.vehicle.count({ where })
  ]);

  return { items, total, page, limit };
};

const createVehicle = (payload) => prisma.vehicle.create({ data: payload });

export { listVehicles, createVehicle };
