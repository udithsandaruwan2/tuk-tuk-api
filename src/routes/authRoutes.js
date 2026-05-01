import { Router } from "express";
import { loginController } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { loginBodySchema } from "../validators/authValidators.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const authRouter = Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate user and return JWT
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Successful login
 */
authRouter.post("/login", validate({ body: loginBodySchema }), asyncHandler(loginController));

export { authRouter };
