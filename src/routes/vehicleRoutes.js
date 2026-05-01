import { Router } from "express";
import { createVehicleController, listVehiclesController } from "../controllers/vehicleController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { vehicleCreateBodySchema, vehicleListQuerySchema } from "../validators/vehicleValidators.js";
import { ROLES } from "../constants/roles.js";

const vehicleRouter = Router();

vehicleRouter.get(
  "/vehicles",
  authenticate,
  authorizeRoles(ROLES.HQ_ADMIN, ROLES.PROVINCIAL_ADMIN, ROLES.STATION_USER),
  validate({ query: vehicleListQuerySchema }),
  asyncHandler(listVehiclesController)
);

vehicleRouter.post(
  "/vehicles",
  authenticate,
  authorizeRoles(ROLES.HQ_ADMIN),
  validate({ body: vehicleCreateBodySchema }),
  asyncHandler(createVehicleController)
);

export { vehicleRouter };
