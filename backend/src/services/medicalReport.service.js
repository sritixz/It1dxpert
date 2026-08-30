import { prisma } from "../config/db.js";
import fs from "fs";
import path from "path";


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

/**
 * Delete a medical report from the database and unlink physical file if uploaded.
 */
export async function deleteMedicalReport(reportId, patientId) {
  const report = await prisma.medicalReport.findFirst({
    where: {
      id: reportId,
      patientId,
    },
  });

  if (!report) {
    throw new Error("Medical report not found or unauthorized.");
  }

  // Delete from database
  await prisma.medicalReport.delete({
    where: { id: reportId },
  });

  // Delete from Server Disk if fileUrl is present
  if (report.fileUrl) {
    try {
      const relativePath = report.fileUrl.replace(/^\//, "");
      const absolutePath = path.resolve(relativePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (err) {
      console.error("Failed to delete physical file from disk:", err);
    }
  }

  return true;
}




