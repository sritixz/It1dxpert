// Doctor routes. DOCTOR and HOSPITAL_ADMIN share this group; attachDoctorProfile
// only sets req.doctorProfileId for the DOCTOR role, which is what narrows
// "all hospital patients" down to "just mine" inside the controllers.

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { scopeToHospital } from "../middleware/scopeToHospital.js";
import { attachDoctorProfile } from "../middleware/attachProfile.js";
import {
  listPatientsController,
  getPatientOverviewController,
  getPatientGlucoseTrendsController,
  getPatientTimelineController,
  listAlertsController,
  resolveAlertController,
} from "../controllers/doctor.controller.js";

const router = Router();

router.use(authenticate, authorize("DOCTOR", "HOSPITAL_ADMIN"), scopeToHospital, attachDoctorProfile);

router.get("/patients", asyncHandler(listPatientsController));
router.get("/patients/:patientId", asyncHandler(getPatientOverviewController));
router.get("/patients/:patientId/glucose-trends", asyncHandler(getPatientGlucoseTrendsController));
router.get("/patients/:patientId/timeline", asyncHandler(getPatientTimelineController));
router.get("/alerts", asyncHandler(listAlertsController));
router.patch("/alerts/:alertId/resolve", asyncHandler(resolveAlertController));

export default router;
