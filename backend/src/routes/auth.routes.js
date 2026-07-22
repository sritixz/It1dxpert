import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import {
  registerPatientController,
  loginController,
  refreshController,
  meController,
} from "../controllers/auth.controller.js";

const router = Router();

// Public routes — no authenticate middleware.
router.post("/register/patient", asyncHandler(registerPatientController));
router.post("/login", asyncHandler(loginController));
router.post("/refresh", asyncHandler(refreshController));

// Protected — needs a valid access token, but no specific role
// (any logged-in user can ask "who am I").
router.get("/me", authenticate, asyncHandler(meController));

export default router;
