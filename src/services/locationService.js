import { prisma } from "../config/db.js";
import { ROLES } from "../constants/roles.js";
import { ApiError } from "../utils/ApiError.js";

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

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new ApiError(404, "Vehicle not found");

  if (user.role === ROLES.DEVICE_CLIENT && user.scope?.vehicleId !== vehicleId) {
    throw new ApiError(403, "Forbidden");
  }

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

export { createPing, getLiveLocations, getVehicleHistory };
