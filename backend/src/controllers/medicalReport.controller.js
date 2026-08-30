import { z } from "zod";
import * as medicalReportService from "../services/medicalReport.service.js";

// Validation Schema for creating a medical report
export const medicalReportSchema = z.object({
  testName: z.string().min(1, "Test name is required"),
  value: z.string().min(1, "Test result value is required"),
  dateTaken: z.string().optional(),
  notes: z.string().optional(),
});
