import { z } from "zod";
import * as medicalReportService from "../services/medicalReport.service.js";

// Validation Schema for creating a medical report
export const medicalReportSchema = z.object({
  testName: z.string().min(1, "Test name is required"),
  value: z.string().min(1, "Test result value is required"),
  dateTaken: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Handle logging a medical report with optional file upload.
 */
export async function createMedicalReportController(req, res) {
  // Validate request body
  const data = medicalReportSchema.parse(req.body);

  let fileUrl = null;
  if (req.file) {
    fileUrl = `/uploads/${req.file.filename}`;
  }

  const report = await medicalReportService.createMedicalReport({
    patientId: req.patientProfileId,
    hospitalId: req.hospitalId,
    testName: data.testName,
    value: data.value,
    dateTaken: data.dateTaken,
    notes: data.notes,
    fileUrl,
  });

  res.status(201).json({
    success: true,
    data: report,
  });
}

/**
 * Handle listing medical reports for the logged-in patient.
 */
export async function listMedicalReportsController(req, res) {
  const reports = await medicalReportService.getMedicalReports(req.patientProfileId);
  res.json({
    success: true,
    data: reports,
  });
}

/**
 * Handle deleting a medical report.
 */
export async function deleteMedicalReportController(req, res) {
  const { reportId } = req.params;
  await medicalReportService.deleteMedicalReport(reportId, req.patientProfileId);
  res.json({
    success: true,
    message: "Medical report deleted successfully.",
  });
}


