// Admin routes. Base chain allows HOSPITAL_ADMIN + SUPER_ADMIN in; a few
// routes then narrow further with a second authorize() call — Express
// runs middleware in order, so stacking a stricter authorize() on a
// specific route after the router-wide one is a normal, supported pattern.

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { scopeToHospital } from "../middleware/scopeToHospital.js";
import { upload } from "../middleware/upload.js";
import {
  createDoctorController,
  createHospitalAdminController,
  createHospitalController,
  listDoctorsController,
  assignPatientController,
  getDashboardStatsController,
  getRegistrationTrendController,
  listHospitalsController,
  getHospitalDetailController,
  updateHospitalController,
  uploadHospitalLogoController,
  listUsersController,
  setUserActiveController,
} from "../controllers/admin.controller.js";
import {
  listTicketsController,
  getTicketStatsController,
  updateTicketStatusController,
} from "../controllers/support.controller.js";

const router = Router();

router.use(authenticate, authorize("HOSPITAL_ADMIN", "SUPER_ADMIN"), scopeToHospital);

// --- Admin Dashboard ---
router.get("/dashboard", asyncHandler(getDashboardStatsController));
router.get("/dashboard/registration-trend", asyncHandler(getRegistrationTrendController));

// --- Clinics / Hospitals ---
router.get("/hospitals", asyncHandler(listHospitalsController));
router.get("/hospitals/:hospitalId", asyncHandler(getHospitalDetailController));
router.patch("/hospitals/:hospitalId", authorize("SUPER_ADMIN"), asyncHandler(updateHospitalController));
router.patch("/hospitals/:hospitalId/logo", upload.single("logo"), asyncHandler(uploadHospitalLogoController));

// --- Users & Roles ---
router.get("/users", asyncHandler(listUsersController));
router.patch("/users/:userId/active", asyncHandler(setUserActiveController));

// --- Support Tickets (admin view) ---
router.get("/support-tickets", asyncHandler(listTicketsController));
router.get("/support-tickets/stats", asyncHandler(getTicketStatsController));
router.patch("/support-tickets/:ticketId/status", asyncHandler(updateTicketStatusController));

// HOSPITAL_ADMIN-only: managing their own hospital's doctors/assignments
router.post("/doctors", authorize("HOSPITAL_ADMIN"), asyncHandler(createDoctorController));
router.get("/doctors", asyncHandler(listDoctorsController)); // both roles can view
router.post("/assign-patient", authorize("HOSPITAL_ADMIN"), asyncHandler(assignPatientController));

// SUPER_ADMIN-only: platform-wide actions
router.post("/hospitals", authorize("SUPER_ADMIN"), asyncHandler(createHospitalController));
router.post("/hospital-admins", authorize("SUPER_ADMIN"), asyncHandler(createHospitalAdminController));

export default router;
