import { prisma } from "../config/db.js";
import { ROLES } from "../constants/roles.js";
import { ApiError } from "../utils/ApiError.js";
import { getScopedVehicleIds } from "./locationPingScope.js";

const assertVehicleAccessForHistory = async (user, vehicleId) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, currentDistrictId: true }
  });
  if (!vehicle) throw new ApiError(404, "Vehicle not found");

  if (user.role === ROLES.HQ_ADMIN) return;

  if (user.role === ROLES.DEVICE_CLIENT) {
    if (user.scope?.vehicleId !== vehicleId) throw new ApiError(403, "Forbidden");
    return;
  }

  if (user.role === ROLES.PROVINCIAL_ADMIN && user.scope?.provinceId) {
    const districts = await prisma.district.findMany({
      where: { provinceId: user.scope.provinceId },
      select: { id: true }
    });
    const allowed = new Set(districts.map((d) => d.id));
    if (!vehicle.currentDistrictId || !allowed.has(vehicle.currentDistrictId)) {
      throw new ApiError(403, "Forbidden");
    }
    return;
  }

  if (user.role === ROLES.STATION_USER && user.scope?.stationId) {
    const station = await prisma.policeStation.findUnique({
      where: { id: user.scope.stationId },
      select: { districtId: true }
    });
    if (!station || vehicle.currentDistrictId !== station.districtId) {
      throw new ApiError(403, "Forbidden");
    }
    return;
  }

  throw new ApiError(403, "Forbidden");
};

const createPing = async (body, user) => {
  if (body.timestamp > new Date()) {
    throw new ApiError(400, "timestamp cannot be in the future");
  }

  if (user.role === ROLES.DEVICE_CLIENT && user.scope?.vehicleId !== body.vehicleId) {
    throw new ApiError(403, "Device is not allowed to submit this vehicle");
  }

  const ping = await prisma.locationPing.create({ data: body });
  return ping;
};

const getLiveLocations = async ({ provinceId, districtId, page, limit }, user) => {
  if (user.role === ROLES.DEVICE_CLIENT && user.scope?.vehicleId) {
    const vehicles = await prisma.vehicle.findMany({
      where: { id: user.scope.vehicleId },
      select: { id: true }
    });
    const vehicleIds = vehicles.map((v) => v.id);
    const skip = (page - 1) * limit;
    const latest = await prisma.locationPing.findMany({
      where: { vehicleId: { in: vehicleIds } },
      distinct: ["vehicleId"],
      orderBy: [{ vehicleId: "asc" }, { timestamp: "desc" }],
      skip,
      take: limit
    });
    return { items: latest, total: vehicleIds.length, page, limit };
  }

  let scopedDistrictIds;
  if (provinceId) {
    const districts = await prisma.district.findMany({ where: { provinceId }, select: { id: true } });
    scopedDistrictIds = districts.map((d) => d.id);
  }

  if (user.role === ROLES.PROVINCIAL_ADMIN && user.scope?.provinceId) {
    const districts = await prisma.district.findMany({
      where: { provinceId: user.scope.provinceId },
      select: { id: true }
    });
    scopedDistrictIds = districts.map((d) => d.id);
  }

  if (user.role === ROLES.STATION_USER && user.scope?.stationId) {
    const station = await prisma.policeStation.findUnique({
      where: { id: user.scope.stationId },
      select: { districtId: true }
    });
    scopedDistrictIds = station ? [station.districtId] : [];
  }

  if (districtId) scopedDistrictIds = [districtId];

  const vehicleWhere = scopedDistrictIds ? { currentDistrictId: { in: scopedDistrictIds } } : {};
  const vehicles = await prisma.vehicle.findMany({ where: vehicleWhere, select: { id: true } });
  const vehicleIds = vehicles.map((v) => v.id);

  const skip = (page - 1) * limit;

  const latest = await prisma.locationPing.findMany({
    where: { vehicleId: { in: vehicleIds } },
    distinct: ["vehicleId"],
    orderBy: [{ vehicleId: "asc" }, { timestamp: "desc" }],
    skip,
    take: limit
  });

  return { items: latest, total: vehicleIds.length, page, limit };
};

const getVehicleHistory = async ({ vehicleId, startDate, endDate, page, limit }, user) => {
  const maxWindowMs = 7 * 24 * 60 * 60 * 1000;
  if (endDate <= startDate) {
    throw new ApiError(400, "startDate must be before endDate");
  }
  if (endDate - startDate > maxWindowMs) {
    throw new ApiError(400, "date range cannot exceed 7 days");
  }

  await assertVehicleAccessForHistory(user, vehicleId);

  const skip = (page - 1) * limit;
  const where = {
    vehicleId,
    timestamp: { gte: startDate, lte: endDate }
  };

  const [items, total] = await Promise.all([
    prisma.locationPing.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip,
      take: limit
    }),
    prisma.locationPing.count({ where })
  ]);

  return { items, total, page, limit };
};

const buildPingWhere = async (query, user) => {
  const { vehicleId, startDate, endDate } = query;
  const where = {};

  if (startDate && endDate) {
    where.timestamp = { gte: new Date(startDate), lte: new Date(endDate) };
  }

  const scoped = await getScopedVehicleIds(user);

  if (scoped === null) {
    if (vehicleId) where.vehicleId = vehicleId;
    return where;
  }

  if (scoped.length === 0) {
    where.vehicleId = { in: [] };
    return where;
  }

  if (vehicleId) {
    if (!scoped.includes(vehicleId)) {
      throw new ApiError(403, "Forbidden");
    }
    where.vehicleId = vehicleId;
  } else {
    where.vehicleId = { in: scoped };
  }

  return where;
};

const listPings = async (query, user) => {
  const { page, limit } = query;
  const where = await buildPingWhere(query, user);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.locationPing.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip,
      take: limit
    }),
    prisma.locationPing.count({ where })
  ]);

  return { items, total, page, limit };
};

const getPingById = async (id, user) => {
  const ping = await prisma.locationPing.findUnique({ where: { id } });
  if (!ping) throw new ApiError(404, "Ping not found");

  const scoped = await getScopedVehicleIds(user);
  if (scoped === null) return ping;
  if (!scoped.includes(ping.vehicleId)) throw new ApiError(403, "Forbidden");
  return ping;
};

const updatePing = async (id, data, user) => {
  if (user.role !== ROLES.HQ_ADMIN) throw new ApiError(403, "Forbidden");
  if (data.timestamp && data.timestamp > new Date()) {
    throw new ApiError(400, "timestamp cannot be in the future");
  }
  try {
    return await prisma.locationPing.update({ where: { id }, data });
  } catch {
    throw new ApiError(404, "Ping not found");
  }
};

const deletePing = async (id, user) => {
  if (user.role !== ROLES.HQ_ADMIN) throw new ApiError(403, "Forbidden");
  try {
    await prisma.locationPing.delete({ where: { id } });
  } catch {
    throw new ApiError(404, "Ping not found");
  }
};

export {
  createPing,
  getLiveLocations,
  getVehicleHistory,
  listPings,
  getPingById,
  updatePing,
  deletePing
};
