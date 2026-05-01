import { prisma } from "../config/db.js";

const listProvinces = ({ search }) => {
  return prisma.province.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" }
  });
};

const listDistricts = ({ provinceId }) => {
  return prisma.district.findMany({
    where: provinceId ? { provinceId } : undefined,
    orderBy: { name: "asc" }
  });
};

const listStations = ({ districtId }) => {
  return prisma.policeStation.findMany({
    where: districtId ? { districtId } : undefined,
    orderBy: { name: "asc" }
  });
};

export { listProvinces, listDistricts, listStations };
