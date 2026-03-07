import { Router } from "express";
import {
  createUserAdmin,
  deleteUserAdmin,
  getMyProfile,
  getUserAdminById,
  listUsers,
  updateOwnProfile,
  updateUserAdmin
} from "../controllers/user.controller.js";
import { authorize, protect } from "../middlewares/auth.middleware.js";
import { ROLES } from "../constants/roles.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  validateAdminUpdateUser,
  validateCreateUser,
  validateMongoIdParam,
  validateSelfUpdateUser,
  validateUserListQuery
} from "../validators/user.validation.js";

const router = Router();

router.get("/me", protect, getMyProfile);
router.patch("/me", protect, validate(validateSelfUpdateUser), updateOwnProfile);
router.get("/", protect, authorize(ROLES.ADMIN, ROLES.SYSTEM_ADMIN), validate(validateUserListQuery, "query"), listUsers);
router.get("/:id", protect, authorize(ROLES.ADMIN, ROLES.SYSTEM_ADMIN), validate(validateMongoIdParam, "params"), getUserAdminById);
router.post("/", protect, authorize(ROLES.ADMIN), validate(validateCreateUser), createUserAdmin);
router.patch("/:id", protect, authorize(ROLES.ADMIN), validate(validateMongoIdParam, "params"), validate(validateAdminUpdateUser), updateUserAdmin);
router.delete("/:id", protect, authorize(ROLES.ADMIN), validate(validateMongoIdParam, "params"), deleteUserAdmin);

export default router;
