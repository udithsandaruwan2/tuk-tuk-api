import { z } from "zod";
import { paginationQuerySchema } from "./commonValidators.js";

const locationPingBodySchema = z.object({
  vehicleId: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().min(0).max(250).optional(),
  heading: z.number().min(0).max(360).optional(),
  timestamp: z.coerce.date()
});

const locationPingListQuerySchema = paginationQuerySchema
  .extend({
    vehicleId: z.string().min(1).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional()
  })
  .refine((q) => (q.startDate && q.endDate) || (!q.startDate && !q.endDate), {
    message: "startDate and endDate must both be set or both omitted"
  });

const locationPingPatchBodySchema = z
  .object({
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    speed: z.number().min(0).max(250).optional().nullable(),
    heading: z.number().min(0).max(360).optional().nullable(),
    timestamp: z.coerce.date().optional()
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field required" });

const locationLiveQuerySchema = paginationQuerySchema.extend({
  provinceId: z.string().min(1).optional(),
  districtId: z.string().min(1).optional()
});

const locationHistoryQuerySchema = paginationQuerySchema.extend({
  startDate: z.coerce.date(),
  endDate: z.coerce.date()
});

export {
  locationPingBodySchema,
  locationPingListQuerySchema,
  locationPingPatchBodySchema,
  locationLiveQuerySchema,
  locationHistoryQuerySchema
};
