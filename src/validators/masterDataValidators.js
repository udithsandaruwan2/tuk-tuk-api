import { z } from "zod";

const provincesQuerySchema = z.object({
  search: z.string().optional()
});

const districtsQuerySchema = z.object({
  provinceId: z.string().min(1).optional()
});

const stationsQuerySchema = z.object({
  districtId: z.string().min(1).optional()
});

export { provincesQuerySchema, districtsQuerySchema, stationsQuerySchema };
