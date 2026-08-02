// Settings routes — DOCTOR only. Unlike most doctor routes, HOSPITAL_ADMIN
// is deliberately excluded here: these are a doctor's own profile/
// preferences, not something an admin manages on their behalf.

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { scopeToHospital } from "../middleware/scopeToHospital.js";
import { attachDoctorProfile } from "../middleware/attachProfile.js";
import {
  getSettingsController,
  updateProfileController,
  updateClinicController,
  updateNotificationsController,
  updateAlertPreferencesController,
} from "../controllers/settings.controller.js";

const router = Router();

router.use(authenticate, authorize("DOCTOR"), scopeToHospital, attachDoctorProfile);

router.get("/", asyncHandler(getSettingsController));
router.patch("/profile", asyncHandler(updateProfileController));
router.patch("/clinic", asyncHandler(updateClinicController));
router.patch("/notifications", asyncHandler(updateNotificationsController));
router.patch("/alert-preferences", asyncHandler(updateAlertPreferencesController));

export default router;
