import { Router } from "express";
import {
  districtsController,
  provincesController,
  stationsController
} from "../controllers/masterDataController.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  districtsQuerySchema,
  provincesQuerySchema,
  stationsQuerySchema
} from "../validators/masterDataValidators.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const masterDataRouter = Router();

masterDataRouter.get(
  "/provinces",
  authenticate,
  validate({ query: provincesQuerySchema }),
  asyncHandler(provincesController)
);
masterDataRouter.get(
  "/districts",
  authenticate,
  validate({ query: districtsQuerySchema }),
  asyncHandler(districtsController)
);
masterDataRouter.get(
  "/stations",
  authenticate,
  validate({ query: stationsQuerySchema }),
  asyncHandler(stationsController)
);

export { masterDataRouter };
