// Appointment service — backs both the doctor's and patient's Appointments
// screens. A doctor manages their own appointments; a HOSPITAL_ADMIN can
// see the whole hospital's; a patient sees only their own.

import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

/**
 * Creates an appointment. Two shapes:
 * - doctorId set: a real on-platform doctor (validated to exist in the hospital)
 * - doctorId omitted + providerName/providerType set: an external provider
 *   (lab, specialist not on the platform) — no validation possible since
 *   there's no record to check against, this is just descriptive text.
 * Called from both doctor-initiated creation (status defaults PENDING,
 * doctor can immediately confirm) and patient-initiated requests (also
 * PENDING — a patient requesting an appointment doesn't auto-confirm it).
 */
export async function createAppointment({
  hospitalId, doctorId, providerName, providerType, patientId,
  scheduledAt, type, purpose, mode, location, notes,
}) {
  const patient = await prisma.patientProfile.findFirst({ where: { id: patientId, hospitalId } });
  if (!patient) throw new AppError("Patient not found in this hospital", 404);

  if (doctorId) {
    const doctor = await prisma.doctorProfile.findFirst({ where: { id: doctorId, hospitalId } });
    if (!doctor) throw new AppError("Doctor not found in this hospital", 404);
  } else if (!providerName) {
    throw new AppError("Either doctorId or providerName is required", 400);
  }

  return prisma.appointment.create({
    data: {
      hospitalId, doctorId: doctorId || null, providerName, providerType,
      patientId, scheduledAt: new Date(scheduledAt), type, purpose, mode, location, notes,
    },
    include: { patient: { select: { fullName: true } }, doctor: { select: { fullName: true } } },
  });
}

/**
 * List appointments with the same filter tabs as the mockup: status, or
 * the special "today" / "upcoming" time-window filters. `status` and
 * `when` are mutually independent — either, both, or neither can be set.
 * `doctorProfileId` scopes to a doctor's own appointments; `patientProfileId`
 * scopes to a patient's own — used by the doctor and patient Appointments
 * screens respectively, never both at once.
 */
export async function listAppointments({ hospitalId, doctorProfileId, patientProfileId, status, when }) {
  const where = {
    hospitalId,
    ...(doctorProfileId ? { doctorId: doctorProfileId } : {}),
    ...(patientProfileId ? { patientId: patientProfileId } : {}),
    ...(status ? { status } : {}),
  };

  if (when === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    where.scheduledAt = { gte: start, lt: end };
  } else if (when === "upcoming") {
    where.scheduledAt = { gte: new Date() };
  } else if (when === "past") {
    where.scheduledAt = { lt: new Date() };
  }

  return prisma.appointment.findMany({
    where,
    include: {
      patient: { select: { fullName: true, dateOfBirth: true, gender: true, diabetesType: true } },
      doctor: { select: { fullName: true, specialization: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

/**
 * Summary stats. Doctor view: today/upcoming-7-days/pending/completed-this-month.
 * Patient view uses the same underlying counts but the frontend labels them
 * to match its own stat cards (Upcoming/Completed This Year/Total This
 * Year/Reminders Set) — see getPatientAppointmentStats below for that shape.
 */
export async function getAppointmentStats({ hospitalId, doctorProfileId, patientProfileId }) {
  const scopeFilter = doctorProfileId ? { doctorId: doctorProfileId } : patientProfileId ? { patientId: patientProfileId } : {};

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const sevenDaysOut = new Date(now);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [today, upcoming7Days, pending, completedThisMonth] = await Promise.all([
    prisma.appointment.count({ where: { hospitalId, ...scopeFilter, scheduledAt: { gte: todayStart, lt: todayEnd } } }),
    prisma.appointment.count({ where: { hospitalId, ...scopeFilter, scheduledAt: { gte: now, lte: sevenDaysOut } } }),
    prisma.appointment.count({ where: { hospitalId, ...scopeFilter, status: "PENDING" } }),
    prisma.appointment.count({ where: { hospitalId, ...scopeFilter, status: "COMPLETED", scheduledAt: { gte: monthStart } } }),
  ]);

  return { today, upcoming7Days, pending, completedThisMonth };
}

/**
 * Patient-side stat cards: Upcoming, Completed (This Year), Total
 * Scheduled (This Year), Reminders Set — different shape from the
 * doctor's cards, so kept as a separate function rather than overloading
 * getAppointmentStats with two unrelated return shapes.
 */
export async function getPatientAppointmentStats(patientProfileId) {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [upcoming, completedThisYear, totalThisYear, remindersSet] = await Promise.all([
    prisma.appointment.count({ where: { patientId: patientProfileId, status: { in: ["PENDING", "CONFIRMED"] }, scheduledAt: { gte: now } } }),
    prisma.appointment.count({ where: { patientId: patientProfileId, status: "COMPLETED", scheduledAt: { gte: yearStart } } }),
    prisma.appointment.count({ where: { patientId: patientProfileId, scheduledAt: { gte: yearStart } } }),
    prisma.appointment.count({ where: { patientId: patientProfileId, reminderEnabled: true, scheduledAt: { gte: now } } }),
  ]);

  return { upcoming, completedThisYear, totalThisYear, remindersSet };
}

/**
 * Per-day appointment counts for a given month — backs the calendar
 * widget's dot indicators. Returns { "2025-05-20": { CONFIRMED: 3, PENDING: 1 }, ... }
 */
export async function getCalendarSummary({ hospitalId, doctorProfileId, patientProfileId, year, month }) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      hospitalId,
      ...(doctorProfileId ? { doctorId: doctorProfileId } : {}),
      ...(patientProfileId ? { patientId: patientProfileId } : {}),
      scheduledAt: { gte: start, lt: end },
    },
    select: { scheduledAt: true, status: true },
  });

  const summary = {};
  for (const appt of appointments) {
    const dateKey = appt.scheduledAt.toISOString().slice(0, 10);
    summary[dateKey] = summary[dateKey] || {};
    summary[dateKey][appt.status] = (summary[dateKey][appt.status] || 0) + 1;
  }
  return summary;
}

export async function updateAppointmentStatus(appointmentId, hospitalId, status) {
  const appointment = await prisma.appointment.findFirst({ where: { id: appointmentId, hospitalId } });
  if (!appointment) throw new AppError("Appointment not found", 404);
  return prisma.appointment.update({ where: { id: appointmentId }, data: { status } });
}

export async function getAppointmentRecord({ appointmentId, hospitalId, doctorProfileId, patientProfileId }) {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      hospitalId,
      ...(doctorProfileId ? { doctorId: doctorProfileId } : {}),
      ...(patientProfileId ? { patientId: patientProfileId } : {}),
    },
    include: {
      patient: {
        select: {
          fullName: true,
          dateOfBirth: true,
          gender: true,
          diabetesType: true,
        }
      },
      doctor: {
        select: {
          fullName: true,
          specialization: true,
        }
      }
    }
  });

  if (!appointment) throw new AppError("Appointment not found", 404);

  const record = await prisma.appointmentRecord.findUnique({
    where: { appointmentId }
  });

  // Find the previous COMPLETED appointment with a record for this patient before the current appointment date
  const previousAppointment = await prisma.appointment.findFirst({
    where: {
      patientId: appointment.patientId,
      status: "COMPLETED",
      id: { not: appointmentId },
      scheduledAt: { lt: appointment.scheduledAt },
      appointmentRecord: { isNot: null }
    },
    orderBy: { scheduledAt: "desc" },
    include: { appointmentRecord: true }
  });

  const previousRecord = previousAppointment?.appointmentRecord || null;

  const differences = {};
  const fields = ["weight", "height", "systolicBP", "diastolicBP", "pulse", "temperature", "bloodGlucose"];
  
  fields.forEach((field) => {
    if (record && record[field] !== null && previousRecord && previousRecord[field] !== null) {
      differences[field] = Number((record[field] - previousRecord[field]).toFixed(2));
    } else {
      differences[field] = null;
    }
  });

  return {
    appointment,
    record,
    previousRecord,
    differences
  };
}

export async function upsertAppointmentRecord({ appointmentId, hospitalId, doctorProfileId, data }) {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      hospitalId,
      ...(doctorProfileId ? { doctorId: doctorProfileId } : {})
    }
  });

  if (!appointment) throw new AppError("Appointment not found", 404);

  const recordData = {
    weight: data.weight !== undefined && data.weight !== "" && data.weight !== null ? parseFloat(data.weight) : null,
    height: data.height !== undefined && data.height !== "" && data.height !== null ? parseFloat(data.height) : null,
    systolicBP: data.systolicBP !== undefined && data.systolicBP !== "" && data.systolicBP !== null ? parseInt(data.systolicBP, 10) : null,
    diastolicBP: data.diastolicBP !== undefined && data.diastolicBP !== "" && data.diastolicBP !== null ? parseInt(data.diastolicBP, 10) : null,
    pulse: data.pulse !== undefined && data.pulse !== "" && data.pulse !== null ? parseInt(data.pulse, 10) : null,
    temperature: data.temperature !== undefined && data.temperature !== "" && data.temperature !== null ? parseFloat(data.temperature) : null,
    bloodGlucose: data.bloodGlucose !== undefined && data.bloodGlucose !== "" && data.bloodGlucose !== null ? parseFloat(data.bloodGlucose) : null,
    notes: data.notes || null,
    prescription: data.prescription || null,
  };

  const record = await prisma.appointmentRecord.upsert({
    where: { appointmentId },
    update: recordData,
    create: {
      appointmentId,
      patientId: appointment.patientId,
      ...recordData
    }
  });

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "COMPLETED" }
  });

  return record;
}
