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

/**
 * Get all medical test reports belonging to a patient.
 */
export async function getMedicalReports(patientId) {
  return prisma.medicalReport.findMany({
    where: { patientId },
    orderBy: { dateTaken: "desc" },
  });
}

/**
 * Get all medical test reports belonging to a patient for a doctor (scoped to hospital).
 */
export async function getPatientReportsForDoctor(patientId, hospitalId) {
  return prisma.medicalReport.findMany({
    where: {
      patientId,
      hospitalId,
    },
    orderBy: { dateTaken: "desc" },
  });
}



