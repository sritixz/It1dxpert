// Medication service — backs the Medications screen (list, add, log a
// dose taken/missed, adherence %).

import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export async function createMedication({ patientId, hospitalId, name, dose, frequency, scheduledTimes, purpose, notes }) {
  return prisma.medication.create({
    data: { patientId, hospitalId, name, dose, frequency, scheduledTimes, purpose, notes },
  });
}

export async function listMedications(patientId) {
  return prisma.medication.findMany({
    where: { patientId, isActive: true },
    include: { doses: { orderBy: { scheduledFor: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Logs a dose EVENT directly (patient taps "taken" or "missed") rather than
 * requiring a pre-scheduled row to exist first — avoids needing a cron
 * job to pre-generate today's scheduled doses for this phase. A scheduler
 * can be layered on top later without changing this shape.
 */
export async function logMedicationDose({ medicationId, patientId, status = "TAKEN", scheduledFor }) {
  const medication = await prisma.medication.findUnique({ where: { id: medicationId } });
  if (!medication || medication.patientId !== patientId) {
    throw new AppError("Medication not found", 404);
  }

  return prisma.medicationDose.create({
    data: {
      medicationId,
      patientId,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
      takenAt: status === "TAKEN" ? new Date() : null,
      status,
    },
  });
}

/**
 * Adherence % over the last N days: taken / (taken + missed), matching the
 * "93% Adherence" stat shown in the Medications mockup.
 */
export async function getAdherence(patientId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const doses = await prisma.medicationDose.findMany({
    where: { patientId, scheduledFor: { gte: since }, status: { in: ["TAKEN", "MISSED"] } },
  });

  const taken = doses.filter((d) => d.status === "TAKEN").length;
  const total = doses.length || 1;

  return {
    takenCount: taken,
    totalCount: doses.length,
    adherencePercent: Math.round((taken / total) * 100),
  };
}
