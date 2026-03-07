import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { validateLogin, validateRegister } from "../validators/auth.validation.js";

const router = Router();

router.post("/register", validate(validateRegister), register);
router.post("/login", validate(validateLogin), login);

export default router;
