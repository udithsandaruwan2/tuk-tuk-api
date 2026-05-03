import { z } from "zod";
import { paginationQuerySchema } from "./commonValidators.js";

const roleEnum = z.enum(["HQ_ADMIN", "PROVINCIAL_ADMIN", "STATION_USER", "DEVICE_CLIENT"]);

const userListQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  role: roleEnum.optional()
});

const userCreateBodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: roleEnum,
  stationId: z.string().min(1).optional().nullable(),
  provinceId: z.string().min(1).optional().nullable(),
  vehicleId: z.string().min(1).optional().nullable()
});

const userPatchBodySchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).max(128).optional(),
    role: roleEnum.optional(),
    stationId: z.string().min(1).optional().nullable(),
    provinceId: z.string().min(1).optional().nullable(),
    vehicleId: z.string().min(1).optional().nullable()
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field required" });

export { userListQuerySchema, userCreateBodySchema, userPatchBodySchema };
