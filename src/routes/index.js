import { Router } from "express";
import { authRouter } from "./authRoutes.js";
import { masterDataRouter } from "./masterDataRoutes.js";
import { vehicleRouter } from "./vehicleRoutes.js";
import { locationRouter } from "./locationRoutes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use(masterDataRouter);
apiRouter.use(vehicleRouter);
apiRouter.use(locationRouter);

export { apiRouter };
