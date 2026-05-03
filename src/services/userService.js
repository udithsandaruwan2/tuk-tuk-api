import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  stationId: true,
  provinceId: true,
  vehicleId: true,
  createdAt: true,
  updatedAt: true
};

const listUsers = async ({ page, limit, search, role }) => {
  const where = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } }
    ];
  }
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userPublicSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.user.count({ where })
  ]);
  return { items, total, page, limit };
};

const getUserById = async (id) => {
  const row = await prisma.user.findUnique({
    where: { id },
    select: userPublicSelect
  });
  if (!row) throw new ApiError(404, "User not found");
  return row;
};

const createUser = async ({ password, ...rest }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: { ...rest, passwordHash },
    select: userPublicSelect
  });
};

const updateUser = async (id, body) => {
  const { password, ...rest } = body;
  const data = { ...rest };
  if (password) data.passwordHash = await bcrypt.hash(password, 10);
  try {
    return await prisma.user.update({
      where: { id },
      data,
      select: userPublicSelect
    });
  } catch {
    throw new ApiError(404, "User not found");
  }
};

const deleteUser = async (id) => {
  try {
    await prisma.user.delete({ where: { id } });
  } catch {
    throw new ApiError(404, "User not found");
  }
};

export { listUsers, getUserById, createUser, updateUser, deleteUser };
