import { z } from "zod";
import { paginationQuerySchema } from "./commonValidators.js";

const provincesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional()
});

const districtsQuerySchema = paginationQuerySchema.extend({
  provinceId: z.string().min(1).optional(),
  search: z.string().optional()
});

const stationsQuerySchema = paginationQuerySchema.extend({
  districtId: z.string().min(1).optional(),
  search: z.string().optional()
});

const provinceCreateBodySchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().min(1).max(32)
});

const provincePatchBodySchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    code: z.string().min(1).max(32).optional()
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field required" });

const districtCreateBodySchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().min(1).max(32),
  provinceId: z.string().min(1)
});

const districtPatchBodySchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    code: z.string().min(1).max(32).optional(),
    provinceId: z.string().min(1).optional()
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field required" });

const stationCreateBodySchema = z.object({
  name: z.string().min(1).max(160),
  code: z.string().min(1).max(64),
  districtId: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

const stationPatchBodySchema = z
  .object({
    name: z.string().min(1).max(160).optional(),
    code: z.string().min(1).max(64).optional(),
    districtId: z.string().min(1).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional()
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field required" });

export {
  provincesQuerySchema,
  districtsQuerySchema,
  stationsQuerySchema,
  provinceCreateBodySchema,
  provincePatchBodySchema,
  districtCreateBodySchema,
  districtPatchBodySchema,
  stationCreateBodySchema,
  stationPatchBodySchema
};
