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

const locationLiveQuerySchema = paginationQuerySchema.extend({
  provinceId: z.string().min(1).optional(),
  districtId: z.string().min(1).optional()
});

const locationHistoryQuerySchema = paginationQuerySchema.extend({
  startDate: z.coerce.date(),
  endDate: z.coerce.date()
});

export { locationPingBodySchema, locationLiveQuerySchema, locationHistoryQuerySchema };
