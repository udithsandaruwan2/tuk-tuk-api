import { z } from "zod";

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

const objectIdParamSchema = z.object({
  vehicleId: z.string().min(1)
});

const idParamSchema = z.object({
  id: z.string().min(1)
});

export { paginationQuerySchema, objectIdParamSchema, idParamSchema };
