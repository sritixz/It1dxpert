import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { scopeToHospital } from "../middleware/scopeToHospital.js";
import { attachPatientProfile } from "../middleware/attachProfile.js";
import { chatWithAgent, analyzeMealNutrients } from "../services/ai.service.js";

const router = Router();

// Configure multer memory storage for processing uploads without storing them on disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB limit
  },
});

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

/**
 * POST /api/patient/ai/analyze-meal
 * Request: Multipart (image file 'mealImage') or JSON { foodText: string }
 */
router.post(
  "/analyze-meal",
  upload.single("mealImage"),
  asyncHandler(async (req, res) => {
    const foodDescription = req.body.foodText;
    const file = req.file;

    if (!file && !foodDescription) {
      return res.status(400).json({
        success: false,
        message: "Either a meal photo (mealImage) or a description (foodText) is required.",
      });
    }

    const fileBuffer = file ? file.buffer : null;
    const mimeType = file ? file.mimetype : null;

    const analysisResult = await analyzeMealNutrients({
      fileBuffer,
      mimeType,
      foodDescription,
    });

    res.json({
      success: true,
      data: analysisResult,
    });
  })
);

export default router;

