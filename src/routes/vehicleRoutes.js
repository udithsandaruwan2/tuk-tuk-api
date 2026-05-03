import { Router } from "express";
import {
  createVehicleController,
  deleteVehicleController,
  getVehicleController,
  listVehiclesController,
  patchVehicleController
} from "../controllers/vehicleController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  vehicleCreateBodySchema,
  vehicleListQuerySchema,
  vehiclePatchBodySchema
} from "../validators/vehicleValidators.js";
import { idParamSchema } from "../validators/commonValidators.js";
import { ROLES } from "../constants/roles.js";

const vehicleRouter = Router();

const readVehicle = [authenticate, authorizeRoles(ROLES.HQ_ADMIN, ROLES.PROVINCIAL_ADMIN, ROLES.STATION_USER)];
const writeVehicle = [authenticate, authorizeRoles(ROLES.HQ_ADMIN)];

vehicleRouter.get(
  "/vehicles",
  ...readVehicle,
  validate({ query: vehicleListQuerySchema }),
  asyncHandler(listVehiclesController)
);
vehicleRouter.get(
  "/vehicles/:id",
  ...readVehicle,
  validate({ params: idParamSchema }),
  asyncHandler(getVehicleController)
);
vehicleRouter.post(
  "/vehicles",
  ...writeVehicle,
  validate({ body: vehicleCreateBodySchema }),
  asyncHandler(createVehicleController)
);
vehicleRouter.patch(
  "/vehicles/:id",
  ...writeVehicle,
  validate({ params: idParamSchema, body: vehiclePatchBodySchema }),
  asyncHandler(patchVehicleController)
);
vehicleRouter.delete(
  "/vehicles/:id",
  ...writeVehicle,
  validate({ params: idParamSchema }),
  asyncHandler(deleteVehicleController)
);

export { vehicleRouter };
