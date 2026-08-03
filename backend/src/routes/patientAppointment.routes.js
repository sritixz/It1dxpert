import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { scopeToHospital } from "../middleware/scopeToHospital.js";
import { attachPatientProfile } from "../middleware/attachProfile.js";
import {
  createAppointmentController,
  listAppointmentsController,
  getAppointmentStatsController,
  getCalendarSummaryController,
} from "../controllers/patientAppointment.controller.js";

const router = Router();

router.use(authenticate, authorize("PATIENT"), scopeToHospital, attachPatientProfile);

router.post("/", asyncHandler(createAppointmentController));
router.get("/", asyncHandler(listAppointmentsController));
router.get("/stats", asyncHandler(getAppointmentStatsController));
router.get("/calendar", asyncHandler(getCalendarSummaryController));

export default router;
