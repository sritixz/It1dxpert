import { prisma } from "../config/db.js";
import fs from "fs";
import path from "path";

/**
 * Create a new document log in the database.
 */
export async function createDocument({
  patientId,
  hospitalId,
  appointmentId,
  fileName,
  fileType,
  fileUrl,
  category,
  uploadedBy,
  notes,
}) {
  return prisma.patientDocument.create({
    data: {
      patientId,
      hospitalId,
      appointmentId: appointmentId || null,
      fileName,
      fileType,
      fileUrl,
      category,
      uploadedBy,
      notes,
    },
  });
}

/**
 * Retrieve all documents belonging to a patient.
 */
export async function getPatientDocuments(patientId) {
  return prisma.patientDocument.findMany({
    where: { patientId },
    include: {
      appointment: {
        select: {
          id: true,
          scheduledAt: true,
          type: true,
          providerName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Retrieve a specific document by its ID and owner ID.
 */
export async function getDocumentById(docId, patientId) {
  return prisma.patientDocument.findFirst({
    where: {
      id: docId,
      patientId,
    },
  });
}

/**
 * Retrieve patient documents for an assigned doctor within the same hospital.
 */
export async function getPatientDocumentsForDoctor(patientId, hospitalId) {
  return prisma.patientDocument.findMany({
    where: {
      patientId,
      hospitalId,
    },
    include: {
      appointment: {
        select: {
          id: true,
          scheduledAt: true,
          type: true,
          providerName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Delete a document from the database and unlink the physical file from the disk.
 */
export async function deletePatientDocument(docId, patientId) {
  const doc = await prisma.patientDocument.findFirst({
    where: {
      id: docId,
      patientId,
    },
  });

  if (!doc) {
    throw new Error("Document not found or unauthorized.");
  }

  // Delete from PostgreSQL
  await prisma.patientDocument.delete({
    where: { id: docId },
  });

  // Delete from Server Disk
  try {
    // doc.fileUrl is formatted as "/uploads/file-name.pdf"
    const relativePath = doc.fileUrl.replace(/^\//, "");
    const absolutePath = path.resolve(relativePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (err) {
    console.error("Failed to delete physical file from disk:", err);
  }

  return true;
}
export async function getDoctorDocumentById(docId, hospitalId) {
  return prisma.patientDocument.findFirst({
    where: {
      id: docId,
      hospitalId,
    },
  });
}

export async function deleteDoctorDocument(docId, hospitalId) {
  const doc = await prisma.patientDocument.findFirst({
    where: {
      id: docId,
      hospitalId,
    },
  });

  if (!doc) {
    throw new Error("Document not found or unauthorized.");
  }

  await prisma.patientDocument.delete({
    where: { id: docId },
  });

  try {
    const relativePath = doc.fileUrl.replace(/^\//, "");
    const absolutePath = path.resolve(relativePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (err) {
    console.error("Failed to delete physical file from disk:", err);
  }

  return true;
}
