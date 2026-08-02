import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { scopeToHospital } from "../middleware/scopeToHospital.js";
import { attachDoctorProfile } from "../middleware/attachProfile.js";
import {
  createAppointmentController,
  listAppointmentsController,
  getAppointmentStatsController,
  getCalendarSummaryController,
  updateAppointmentStatusController,
} from "../controllers/appointment.controller.js";

const router = Router();

router.use(authenticate, authorize("DOCTOR", "HOSPITAL_ADMIN"), scopeToHospital, attachDoctorProfile);

router.post("/", asyncHandler(createAppointmentController));
router.get("/", asyncHandler(listAppointmentsController));
router.get("/stats", asyncHandler(getAppointmentStatsController));
router.get("/calendar", asyncHandler(getCalendarSummaryController));
router.patch("/:appointmentId/status", asyncHandler(updateAppointmentStatusController));

export default router;
