import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { scopeToHospital } from "../middleware/scopeToHospital.js";
import { attachPatientProfile } from "../middleware/attachProfile.js";
import { chatWithAgent } from "../services/ai.service.js";

const router = Router();

// Protect all AI routes: Patient role and scope checks
router.use(authenticate, authorize("PATIENT"), scopeToHospital, attachPatientProfile);

/**
 * POST /api/patient/ai/chat
 * Body: { message: string, history: Array<{role: string, content: string}> }
 */
router.post("/chat", asyncHandler(async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      message: "Message is required.",
    });
  }

  // req.patientProfileId is attached by attachPatientProfile middleware
  const aiResponse = await chatWithAgent(req.patientProfileId, message, history || []);

  res.json({
    success: true,
    data: {
      response: aiResponse,
    },
  });
}));

export default router;
