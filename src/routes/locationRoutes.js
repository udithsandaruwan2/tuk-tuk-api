import { Router } from "express";
import {
  createPingController,
  liveLocationController,
  vehicleHistoryController
} from "../controllers/locationController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  locationHistoryQuerySchema,
  locationLiveQuerySchema,
  locationPingBodySchema
} from "../validators/locationValidators.js";
import { objectIdParamSchema } from "../validators/commonValidators.js";
import { ROLES } from "../constants/roles.js";

const locationRouter = Router();

locationRouter.post(
  "/location/ping",
  authenticate,
  authorizeRoles(ROLES.DEVICE_CLIENT),
  validate({ body: locationPingBodySchema }),
  asyncHandler(createPingController)
);

locationRouter.get(
  "/location/live",
  authenticate,
  validate({ query: locationLiveQuerySchema }),
  asyncHandler(liveLocationController)
);

locationRouter.get(
  "/location/history/:vehicleId",
  authenticate,
  validate({ params: objectIdParamSchema, query: locationHistoryQuerySchema }),
  asyncHandler(vehicleHistoryController)
);

export { locationRouter };
