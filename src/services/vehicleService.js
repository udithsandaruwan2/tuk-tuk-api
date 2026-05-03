import { prisma } from "../config/db.js";
import { ROLES } from "../constants/roles.js";
import { ApiError } from "../utils/ApiError.js";

const buildVehicleWhere = ({ districtId, status, search }) => {
  const where = {};
  if (status) where.status = status;
  if (districtId) where.currentDistrictId = districtId;
  if (search) {
    where.OR = [
      { regNumber: { contains: search, mode: "insensitive" } },
      { deviceId: { contains: search, mode: "insensitive" } },
      { driverName: { contains: search, mode: "insensitive" } }
    ];
  }
  return where;
};

const scopeVehicleWhere = async (user, baseWhere) => {
  if (!user || user.role === ROLES.HQ_ADMIN) return baseWhere;

  if (user.role === ROLES.PROVINCIAL_ADMIN && user.scope?.provinceId) {
    const districts = await prisma.district.findMany({
      where: { provinceId: user.scope.provinceId },
      select: { id: true }
    });
    const ids = districts.map((d) => d.id);
    return { AND: [baseWhere, { currentDistrictId: { in: ids } }] };
  }

  if (user.role === ROLES.STATION_USER && user.scope?.stationId) {
    const station = await prisma.policeStation.findUnique({
      where: { id: user.scope.stationId },
      select: { districtId: true }
    });
    if (!station) return { AND: [baseWhere, { id: { in: [] } }] };
    return { AND: [baseWhere, { currentDistrictId: station.districtId }] };
  }

  return baseWhere;
};

const listVehicles = async (query, user) => {
  const { page, limit, districtId, status, search } = query;
  const base = buildVehicleWhere({ districtId, status, search });
  const where = await scopeVehicleWhere(user, base);
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

const getVehicleById = async (id, user) => {
  const row = await prisma.vehicle.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Vehicle not found");
  if (user?.role === ROLES.HQ_ADMIN) return row;

  if (user?.role === ROLES.PROVINCIAL_ADMIN && user.scope?.provinceId) {
    if (!row.currentDistrictId) throw new ApiError(403, "Forbidden");
    const ok = await prisma.district.findFirst({
      where: { id: row.currentDistrictId, provinceId: user.scope.provinceId }
    });
    if (!ok) throw new ApiError(403, "Forbidden");
    return row;
  }

  if (user?.role === ROLES.STATION_USER && user.scope?.stationId) {
    const station = await prisma.policeStation.findUnique({
      where: { id: user.scope.stationId },
      select: { districtId: true }
    });
    if (!station || row.currentDistrictId !== station.districtId) {
      throw new ApiError(403, "Forbidden");
    }
    return row;
  }

  throw new ApiError(403, "Forbidden");
};

const createVehicle = (payload) => prisma.vehicle.create({ data: payload });

const updateVehicle = async (id, data) => {
  try {
    return await prisma.vehicle.update({ where: { id }, data });
  } catch {
    throw new ApiError(404, "Vehicle not found");
  }
};

const deleteVehicle = async (id) => {
  try {
    await prisma.vehicle.delete({ where: { id } });
  } catch {
    throw new ApiError(404, "Vehicle not found");
  }
};

export { listVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle };
