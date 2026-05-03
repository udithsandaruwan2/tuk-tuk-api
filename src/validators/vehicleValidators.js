import { z } from "zod";
import { paginationQuerySchema } from "./commonValidators.js";

const vehicleCreateBodySchema = z.object({
  regNumber: z.string().min(3).max(20),
  deviceId: z.string().min(4).max(64),
  driverName: z.string().min(2).max(100).optional(),
  currentDistrictId: z.string().min(1).optional()
});

const vehiclePatchBodySchema = z
  .object({
    regNumber: z.string().min(3).max(20).optional(),
    deviceId: z.string().min(4).max(64).optional(),
    driverName: z.string().min(2).max(100).optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).optional(),
    currentDistrictId: z.string().min(1).optional().nullable()
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field required" });

const vehicleListQuerySchema = paginationQuerySchema.extend({
  districtId: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).optional(),
  search: z.string().optional()
});

export { vehicleCreateBodySchema, vehiclePatchBodySchema, vehicleListQuerySchema };
