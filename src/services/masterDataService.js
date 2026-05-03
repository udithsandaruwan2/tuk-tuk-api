import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

const provinceWhereFromSearch = (search) =>
  search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } }
        ]
      }
    : undefined;

const listProvinces = ({ search, page, limit }) => {
  const where = provinceWhereFromSearch(search);
  if (page == null || limit == null) {
    return prisma.province.findMany({
      where,
      orderBy: { name: "asc" }
    });
  }
  const skip = (page - 1) * limit;
  return Promise.all([
    prisma.province.findMany({ where, orderBy: { name: "asc" }, skip, take: limit }),
    prisma.province.count({ where })
  ]).then(([items, total]) => ({ items, total, page, limit }));
};

const getProvinceById = async (id) => {
  const row = await prisma.province.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Province not found");
  return row;
};

const createProvince = (data) => prisma.province.create({ data });

const updateProvince = async (id, data) => {
  try {
    return await prisma.province.update({ where: { id }, data });
  } catch {
    throw new ApiError(404, "Province not found");
  }
};

const deleteProvince = async (id) => {
  try {
    await prisma.province.delete({ where: { id } });
  } catch {
    throw new ApiError(404, "Province not found");
  }
};

const districtWhere = ({ provinceId, search }) => {
  const parts = [];
  if (provinceId) parts.push({ provinceId });
  if (search) {
    parts.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } }
      ]
    });
  }
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return { AND: parts };
};

const listDistricts = ({ provinceId, search, page, limit }) => {
  const where = districtWhere({ provinceId, search });
  if (page == null || limit == null) {
    return prisma.district.findMany({
      where,
      orderBy: { name: "asc" }
    });
  }
  const skip = (page - 1) * limit;
  return Promise.all([
    prisma.district.findMany({ where, orderBy: { name: "asc" }, skip, take: limit }),
    prisma.district.count({ where })
  ]).then(([items, total]) => ({ items, total, page, limit }));
};

const getDistrictById = async (id) => {
  const row = await prisma.district.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "District not found");
  return row;
};

const createDistrict = (data) => prisma.district.create({ data });

const updateDistrict = async (id, data) => {
  try {
    return await prisma.district.update({ where: { id }, data });
  } catch {
    throw new ApiError(404, "District not found");
  }
};

const deleteDistrict = async (id) => {
  try {
    await prisma.district.delete({ where: { id } });
  } catch {
    throw new ApiError(404, "District not found");
  }
};

const stationWhere = ({ districtId, search }) => {
  const parts = [];
  if (districtId) parts.push({ districtId });
  if (search) {
    parts.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } }
      ]
    });
  }
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return { AND: parts };
};

const listStations = ({ districtId, search, page, limit }) => {
  const where = stationWhere({ districtId, search });
  if (page == null || limit == null) {
    return prisma.policeStation.findMany({
      where,
      orderBy: { name: "asc" }
    });
  }
  const skip = (page - 1) * limit;
  return Promise.all([
    prisma.policeStation.findMany({ where, orderBy: { name: "asc" }, skip, take: limit }),
    prisma.policeStation.count({ where })
  ]).then(([items, total]) => ({ items, total, page, limit }));
};

const getStationById = async (id) => {
  const row = await prisma.policeStation.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Police station not found");
  return row;
};

const createStation = (data) => prisma.policeStation.create({ data });

const updateStation = async (id, data) => {
  try {
    return await prisma.policeStation.update({ where: { id }, data });
  } catch {
    throw new ApiError(404, "Police station not found");
  }
};

const deleteStation = async (id) => {
  try {
    await prisma.policeStation.delete({ where: { id } });
  } catch {
    throw new ApiError(404, "Police station not found");
  }
};

export {
  listProvinces,
  getProvinceById,
  createProvince,
  updateProvince,
  deleteProvince,
  listDistricts,
  getDistrictById,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  listStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation
};
