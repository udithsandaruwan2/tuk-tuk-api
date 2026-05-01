import { z } from "zod";
import { paginationQuerySchema } from "./commonValidators.js";

const vehicleCreateBodySchema = z.object({
  regNumber: z.string().min(3).max(20),
  deviceId: z.string().min(4).max(64),
  driverName: z.string().min(2).max(100).optional(),
  currentDistrictId: z.string().min(1).optional()
});

const vehicleListQuerySchema = paginationQuerySchema.extend({
  districtId: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).optional()
});

export { vehicleCreateBodySchema, vehicleListQuerySchema };
