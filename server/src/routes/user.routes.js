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

const router = Router();

router.get("/me", protect, getMyProfile);
router.patch("/me", protect, updateOwnProfile);
router.get("/", protect, authorize(ROLES.ADMIN, ROLES.SYSTEM_ADMIN), listUsers);
router.get("/:id", protect, authorize(ROLES.ADMIN, ROLES.SYSTEM_ADMIN), getUserAdminById);
router.post("/", protect, authorize(ROLES.ADMIN), createUserAdmin);
router.patch("/:id", protect, authorize(ROLES.ADMIN), updateUserAdmin);
router.delete("/:id", protect, authorize(ROLES.ADMIN), deleteUserAdmin);

export default router;
