import { Router } from "express";
import {
  createUserController,
  deleteUserController,
  getUserController,
  listUsersController,
  patchUserController
} from "../controllers/userController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { userCreateBodySchema, userListQuerySchema, userPatchBodySchema } from "../validators/userValidators.js";
import { idParamSchema } from "../validators/commonValidators.js";
import { ROLES } from "../constants/roles.js";
import { ApiError } from "../utils/ApiError.js";

const userRouter = Router();

const hq = [authenticate, authorizeRoles(ROLES.HQ_ADMIN)];

const noSelfDelete = (req, _res, next) => {
  const id = req.validated?.params?.id || req.params.id;
  if (id === req.user?.sub) {
    return next(new ApiError(400, "Cannot delete your own account"));
  }
  return next();
};

userRouter.get("/users", ...hq, validate({ query: userListQuerySchema }), asyncHandler(listUsersController));
userRouter.get("/users/:id", ...hq, validate({ params: idParamSchema }), asyncHandler(getUserController));
userRouter.post("/users", ...hq, validate({ body: userCreateBodySchema }), asyncHandler(createUserController));
userRouter.patch(
  "/users/:id",
  ...hq,
  validate({ params: idParamSchema, body: userPatchBodySchema }),
  asyncHandler(patchUserController)
);
userRouter.delete(
  "/users/:id",
  ...hq,
  validate({ params: idParamSchema }),
  noSelfDelete,
  asyncHandler(deleteUserController)
);

export { userRouter };
