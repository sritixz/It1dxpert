import { prisma } from "../config/db.js";

/**
 * Medical Report database operations service.
 */

/**
 * Log a new medical test report in the database.
 */
export async function createMedicalReport({
  patientId,
  hospitalId,
  testName,
  value,
  dateTaken,
  notes,
  fileUrl,
}) {
  return prisma.medicalReport.create({
    data: {
      patientId,
      hospitalId,
      testName,
      value,
      dateTaken: dateTaken ? new Date(dateTaken) : new Date(),
      notes: notes || null,
      fileUrl: fileUrl || null,
    },
  });
}

