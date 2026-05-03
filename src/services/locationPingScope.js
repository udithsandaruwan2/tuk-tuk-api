import { prisma } from "../config/db.js";
import { ROLES } from "../constants/roles.js";

/**
 * Returns allowed vehicleId list for ping queries, or null = no extra filter (HQ sees all).
 */
const getScopedVehicleIds = async (user) => {
  if (!user) return [];
  if (user.role === ROLES.HQ_ADMIN) return null;

  if (user.role === ROLES.DEVICE_CLIENT && user.scope?.vehicleId) {
    return [user.scope.vehicleId];
  }

  if (user.role === ROLES.PROVINCIAL_ADMIN && user.scope?.provinceId) {
    const districts = await prisma.district.findMany({
      where: { provinceId: user.scope.provinceId },
      select: { id: true }
    });
    const districtIds = districts.map((d) => d.id);
    const vehicles = await prisma.vehicle.findMany({
      where: { currentDistrictId: { in: districtIds } },
      select: { id: true }
    });
    return vehicles.map((v) => v.id);
  }

  if (user.role === ROLES.STATION_USER && user.scope?.stationId) {
    const station = await prisma.policeStation.findUnique({
      where: { id: user.scope.stationId },
      select: { districtId: true }
    });
    if (!station) return [];
    const vehicles = await prisma.vehicle.findMany({
      where: { currentDistrictId: station.districtId },
      select: { id: true }
    });
    return vehicles.map((v) => v.id);
  }

  return [];
};

export { getScopedVehicleIds };
