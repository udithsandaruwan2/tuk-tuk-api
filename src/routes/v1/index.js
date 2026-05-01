import { Router } from "express";
import authRouter from "./auth.js";
import boundariesRouter from "./boundaries.js";
import vehiclesRouter from "./vehicles.js";
import analyticsRouter from "./analytics.js";
import ingestRouter from "./ingest.js";

const router = Router();

router.use(authRouter);
router.use(ingestRouter);
router.use(boundariesRouter);
router.use(vehiclesRouter);
router.use(analyticsRouter);

export default router;
