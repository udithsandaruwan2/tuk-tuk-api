import { Router } from "express";
import {
  createPingController,
  deletePingController,
  getPingController,
  liveLocationController,
  listPingsController,
  patchPingController,
  vehicleHistoryController
} from "../controllers/locationController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  locationHistoryQuerySchema,
  locationLiveQuerySchema,
  locationPingBodySchema,
  locationPingListQuerySchema,
  locationPingPatchBodySchema
} from "../validators/locationValidators.js";
import { idParamSchema, objectIdParamSchema } from "../validators/commonValidators.js";
import { ROLES } from "../constants/roles.js";

const locationRouter = Router();

const pingReaders = [
  authenticate,
  authorizeRoles(ROLES.HQ_ADMIN, ROLES.PROVINCIAL_ADMIN, ROLES.STATION_USER, ROLES.DEVICE_CLIENT)
];
const hqOnly = [authenticate, authorizeRoles(ROLES.HQ_ADMIN)];

locationRouter.post(
  "/location/ping",
  authenticate,
  authorizeRoles(ROLES.DEVICE_CLIENT),
  validate({ body: locationPingBodySchema }),
  asyncHandler(createPingController)
);

locationRouter.get(
  "/location/pings",
  ...pingReaders,
  validate({ query: locationPingListQuerySchema }),
  asyncHandler(listPingsController)
);
locationRouter.get(
  "/location/pings/:id",
  ...pingReaders,
  validate({ params: idParamSchema }),
  asyncHandler(getPingController)
);
locationRouter.patch(
  "/location/pings/:id",
  ...hqOnly,
  validate({ params: idParamSchema, body: locationPingPatchBodySchema }),
  asyncHandler(patchPingController)
);
locationRouter.delete(
  "/location/pings/:id",
  ...hqOnly,
  validate({ params: idParamSchema }),
  asyncHandler(deletePingController)
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
