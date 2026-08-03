import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { scopeToHospital } from "../middleware/scopeToHospital.js";
import { attachPatientProfile } from "../middleware/attachProfile.js";
import {
  getSettingsController,
  updateProfileController,
  updateEmergencyContactController,
  updatePreferencesController,
  exportDataController,
  changePasswordController,
} from "../controllers/patientSettings.controller.js";

const router = Router();

router.use(authenticate, authorize("PATIENT"), scopeToHospital, attachPatientProfile);

router.get("/", asyncHandler(getSettingsController));
router.patch("/profile", asyncHandler(updateProfileController));
router.patch("/emergency-contact", asyncHandler(updateEmergencyContactController));
router.patch("/preferences", asyncHandler(updatePreferencesController));
router.post("/change-password", asyncHandler(changePasswordController));
router.get("/export", asyncHandler(exportDataController));

export default router;
