import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const connectDb = async () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  await prisma.$connect();
};

export { connectDb, prisma };
