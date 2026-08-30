// Patient routes. Full chain: authenticate -> authorize -> scopeToHospital
// -> attachPatientProfile. That last step is new this phase — it's what
// lets every controller below use req.patientProfileId without looking it
// up itself (see middleware/attachProfile.js for why User.id != PatientProfile.id).

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { scopeToHospital } from "../middleware/scopeToHospital.js";
import { attachPatientProfile } from "../middleware/attachProfile.js";
import { upload } from "../middleware/upload.js";
import {
  createMedicalReportController,
  listMedicalReportsController,
  deleteMedicalReportController,
} from "../controllers/medicalReport.controller.js";
import {
  logGlucoseController,
  updateGlucoseLogController,
  deleteGlucoseLogController,
  logInsulinController,
  listInsulinLogsController,
  updateInsulinLogController,
  deleteInsulinLogController,
  logMealController,
  updateMealLogController,
  deleteMealLogController,
  logActivityController,
  getActivitySummaryController,
  updateActivityLogController,
  deleteActivityLogController,
  logNoteController,
  getDailyLogController,
  getGlucoseTrendsController,
  createMedicationController,
  listMedicationsController,
  logDoseController,
  getAdherenceController,
  getGamificationStatusController,
  getPatient7DayReportController,
} from "../controllers/patient.controller.js";

const router = Router();

router.use(authenticate, authorize("PATIENT"), scopeToHospital, attachPatientProfile);

// Logging — one endpoint per category, matching the dashboard's Quick Actions
router.post("/logs/glucose", asyncHandler(logGlucoseController));
router.post("/logs/insulin", asyncHandler(logInsulinController));
router.post("/logs/meal", asyncHandler(logMealController));
router.post("/logs/activity", asyncHandler(logActivityController));
router.post("/logs/note", asyncHandler(logNoteController));

// Insulin Records screen — list/summary + edit/delete individual entries
router.get("/insulin-records", asyncHandler(listInsulinLogsController));
router.patch("/logs/insulin/:logId", asyncHandler(updateInsulinLogController));
router.delete("/logs/insulin/:logId", asyncHandler(deleteInsulinLogController));

// Glucose Logs — edit/delete individual entries
router.patch("/logs/glucose/:logId", asyncHandler(updateGlucoseLogController));
router.delete("/logs/glucose/:logId", asyncHandler(deleteGlucoseLogController));

// Meal Logs — edit/delete individual entries
router.patch("/logs/meal/:logId", asyncHandler(updateMealLogController));
router.delete("/logs/meal/:logId", asyncHandler(deleteMealLogController));

// Activity screen — summary + edit/delete individual entries
router.get("/activity-summary", asyncHandler(getActivitySummaryController));
router.patch("/logs/activity/:logId", asyncHandler(updateActivityLogController));
router.delete("/logs/activity/:logId", asyncHandler(deleteActivityLogController));

// Daily Log screen — GET /daily-log?date=YYYY-MM-DD (defaults to today)
router.get("/daily-log", asyncHandler(getDailyLogController));

// Glucose Trends screen — GET /glucose-trends?days=7|14|30|90
router.get("/glucose-trends", asyncHandler(getGlucoseTrendsController));

// Medications screen
router.post("/medications", asyncHandler(createMedicationController));
router.get("/medications", asyncHandler(listMedicationsController));
router.post("/medications/dose", asyncHandler(logDoseController));
router.get("/medications/adherence", asyncHandler(getAdherenceController));

// Medical Reports
router.post("/medical-reports", upload.single("file"), asyncHandler(createMedicalReportController));
router.get("/medical-reports", asyncHandler(listMedicalReportsController));
router.delete("/medical-reports/:reportId", asyncHandler(deleteMedicalReportController));

// Gamification — streak + earned badges, for whatever UI surfaces them
router.get("/gamification", asyncHandler(getGamificationStatusController));

// 7-day Health status & logs PDF report endpoint
router.get("/report/last-7-days", asyncHandler(getPatient7DayReportController));

export default router;
