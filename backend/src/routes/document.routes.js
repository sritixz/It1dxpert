import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { scopeToHospital } from "../middleware/scopeToHospital.js";
import { attachPatientProfile } from "../middleware/attachProfile.js";
import {
  createDocument,
  getPatientDocuments,
  deletePatientDocument,
} from "../services/document.service.js";

const router = Router();

// Protect routes for patients
router.use(authenticate, authorize("PATIENT"), scopeToHospital, attachPatientProfile);

/**
 * POST /api/patient/documents
 * Request: Multipart form-data with fields:
 * - 'file': file binary
 * - 'category': "LAB_RESULT" | "PRESCRIPTION" | "OTHER"
 * - 'notes': string
 * - 'appointmentId': string (optional)
 * - 'customName': string (optional)
 */
router.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file was uploaded.",
      });
    }

    const { category, notes, appointmentId, customName } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Document category is required.",
      });
    }

    const fileName = customName || req.file.originalname;
    const fileUrl = `/uploads/${req.file.filename}`;

    const document = await createDocument({
      patientId: req.patientProfileId,
      hospitalId: req.hospitalId,
      appointmentId: appointmentId || null,
      fileName,
      fileType: req.file.mimetype,
      fileUrl,
      category,
      uploadedBy: "PATIENT",
      notes: notes || null,
    });

    res.status(201).json({
      success: true,
      data: document,
    });
  })
);

/**
 * GET /api/patient/documents
 * List all documents uploaded by/for this patient.
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const documents = await getPatientDocuments(req.patientProfileId);
    res.json({
      success: true,
      data: documents,
    });
  })
);

/**
 * DELETE /api/patient/documents/:docId
 * Deletes document record from database and unlinks file from server disk.
 */
router.delete(
  "/:docId",
  asyncHandler(async (req, res) => {
    const { docId } = req.params;
    await deletePatientDocument(docId, req.patientProfileId);
    res.json({
      success: true,
      message: "Document deleted successfully.",
    });
  })
);

export default router;
