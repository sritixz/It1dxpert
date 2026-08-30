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
  markAlertReadController,
  resolveAlertController,
  getPatientAppointmentRecordsController,
  listPatientDocumentsController,
  doctorUploadPrescriptionController,
  doctorDeleteDocumentController,
  getPatient7DayReportForDoctorController,
} from "../controllers/doctor.controller.js";
import { listPatientReportsForDoctorController } from "../controllers/medicalReport.controller.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(authenticate, authorize("DOCTOR", "HOSPITAL_ADMIN"), scopeToHospital, attachDoctorProfile);

router.get("/patients", asyncHandler(listPatientsController));
router.get("/patients/:patientId", asyncHandler(getPatientOverviewController));
router.get("/patients/:patientId/glucose-trends", asyncHandler(getPatientGlucoseTrendsController));
router.get("/patients/:patientId/timeline", asyncHandler(getPatientTimelineController));
router.get("/patients/:patientId/appointment-records", asyncHandler(getPatientAppointmentRecordsController));
router.get("/patients/:patientId/documents", asyncHandler(listPatientDocumentsController));
router.get("/patients/:patientId/medical-reports", asyncHandler(listPatientReportsForDoctorController));
router.post("/patients/:patientId/documents", upload.single("file"), asyncHandler(doctorUploadPrescriptionController));
router.delete("/patients/:patientId/documents/:docId", asyncHandler(doctorDeleteDocumentController));
router.get("/patients/:patientId/report/last-7-days", asyncHandler(getPatient7DayReportForDoctorController));
router.get("/alerts", asyncHandler(listAlertsController));
router.patch("/alerts/:alertId/read", asyncHandler(markAlertReadController));
router.patch("/alerts/:alertId/resolve", asyncHandler(resolveAlertController));

export default router;
