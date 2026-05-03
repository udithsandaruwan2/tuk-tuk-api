import { Router } from "express";
import {
  districtCreateController,
  districtDeleteController,
  districtGetController,
  districtPatchController,
  districtsListController,
  provinceCreateController,
  provinceDeleteController,
  provinceGetController,
  provincePatchController,
  provincesListController,
  stationCreateController,
  stationDeleteController,
  stationGetController,
  stationPatchController,
  stationsListController
} from "../controllers/masterDataController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  districtCreateBodySchema,
  districtPatchBodySchema,
  districtsQuerySchema,
  provinceCreateBodySchema,
  provincePatchBodySchema,
  provincesQuerySchema,
  stationCreateBodySchema,
  stationPatchBodySchema,
  stationsQuerySchema
} from "../validators/masterDataValidators.js";
import { idParamSchema } from "../validators/commonValidators.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ROLES } from "../constants/roles.js";

const masterDataRouter = Router();

const hqOnly = [authenticate, authorizeRoles(ROLES.HQ_ADMIN)];
const readRoles = [authenticate, authorizeRoles(ROLES.HQ_ADMIN, ROLES.PROVINCIAL_ADMIN, ROLES.STATION_USER)];

/* ---------- Provinces ---------- */
masterDataRouter.get(
  "/provinces",
  ...readRoles,
  validate({ query: provincesQuerySchema }),
  asyncHandler(provincesListController)
);
masterDataRouter.get(
  "/provinces/:id",
  ...readRoles,
  validate({ params: idParamSchema }),
  asyncHandler(provinceGetController)
);
masterDataRouter.post(
  "/provinces",
  ...hqOnly,
  validate({ body: provinceCreateBodySchema }),
  asyncHandler(provinceCreateController)
);
masterDataRouter.patch(
  "/provinces/:id",
  ...hqOnly,
  validate({ params: idParamSchema, body: provincePatchBodySchema }),
  asyncHandler(provincePatchController)
);
masterDataRouter.delete(
  "/provinces/:id",
  ...hqOnly,
  validate({ params: idParamSchema }),
  asyncHandler(provinceDeleteController)
);

/* ---------- Districts ---------- */
masterDataRouter.get(
  "/districts",
  ...readRoles,
  validate({ query: districtsQuerySchema }),
  asyncHandler(districtsListController)
);
masterDataRouter.get(
  "/districts/:id",
  ...readRoles,
  validate({ params: idParamSchema }),
  asyncHandler(districtGetController)
);
masterDataRouter.post(
  "/districts",
  ...hqOnly,
  validate({ body: districtCreateBodySchema }),
  asyncHandler(districtCreateController)
);
masterDataRouter.patch(
  "/districts/:id",
  ...hqOnly,
  validate({ params: idParamSchema, body: districtPatchBodySchema }),
  asyncHandler(districtPatchController)
);
masterDataRouter.delete(
  "/districts/:id",
  ...hqOnly,
  validate({ params: idParamSchema }),
  asyncHandler(districtDeleteController)
);

/* ---------- Stations ---------- */
masterDataRouter.get(
  "/stations",
  ...readRoles,
  validate({ query: stationsQuerySchema }),
  asyncHandler(stationsListController)
);
masterDataRouter.get(
  "/stations/:id",
  ...readRoles,
  validate({ params: idParamSchema }),
  asyncHandler(stationGetController)
);
masterDataRouter.post(
  "/stations",
  ...hqOnly,
  validate({ body: stationCreateBodySchema }),
  asyncHandler(stationCreateController)
);
masterDataRouter.patch(
  "/stations/:id",
  ...hqOnly,
  validate({ params: idParamSchema, body: stationPatchBodySchema }),
  asyncHandler(stationPatchController)
);
masterDataRouter.delete(
  "/stations/:id",
  ...hqOnly,
  validate({ params: idParamSchema }),
  asyncHandler(stationDeleteController)
);

export { masterDataRouter };
