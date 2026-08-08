import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { scopeToHospital } from "../middleware/scopeToHospital.js";
import { attachPatientProfile } from "../middleware/attachProfile.js";
import { getInsulinAdvice } from "../services/insulinAdvisor.service.js";

const router = Router();

// Protect all routes for patients
router.use(authenticate, authorize("PATIENT"), scopeToHospital, attachPatientProfile);

/**
 * GET /api/patient/insulin-advisor
 * Fetches glucose trend analysis and insulin dose suggestions.
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const advice = await getInsulinAdvice(req.patientProfileId);
    res.json({
      success: true,
      data: advice,
    });
  })
);

export default router;
