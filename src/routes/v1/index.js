import { Router } from "express";
import boundariesRouter from "./boundaries.js";
import vehiclesRouter from "./vehicles.js";
import analyticsRouter from "./analytics.js";

const router = Router();

router.use(boundariesRouter);
router.use(vehiclesRouter);
router.use(analyticsRouter);

export default router;
