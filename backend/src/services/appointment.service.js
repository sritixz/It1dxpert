// Appointment service — backs the Appointments screen. A doctor manages
// their own appointments; a HOSPITAL_ADMIN can see the whole hospital's,
// same access pattern as everywhere else on the doctor side.

import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export async function createAppointment({ hospitalId, doctorId, patientId, scheduledAt, type, purpose, mode, notes }) {
  const [patient, doctor] = await Promise.all([
    prisma.patientProfile.findFirst({ where: { id: patientId, hospitalId } }),
    prisma.doctorProfile.findFirst({ where: { id: doctorId, hospitalId } }),
  ]);
  if (!patient) throw new AppError("Patient not found in this hospital", 404);
  if (!doctor) throw new AppError("Doctor not found in this hospital", 404);

  return prisma.appointment.create({
    data: { hospitalId, doctorId, patientId, scheduledAt: new Date(scheduledAt), type, purpose, mode, notes },
    include: { patient: { select: { fullName: true } } },
  });
}

/**
 * List appointments with the same filter tabs as the mockup: status, or
 * the special "today" / "upcoming" time-window filters. `status` and
 * `when` are mutually independent — either, both, or neither can be set.
 */
export async function listAppointments({ hospitalId, doctorProfileId, status, when }) {
  const where = {
    hospitalId,
    ...(doctorProfileId ? { doctorId: doctorProfileId } : {}),
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
  }

  return prisma.appointment.findMany({
    where,
    include: { patient: { select: { fullName: true, dateOfBirth: true, gender: true, diabetesType: true } } },
    orderBy: { scheduledAt: "asc" },
  });
}

/**
 * Summary stats for the 4 stat cards: today's count, upcoming-7-days count,
 * pending count, and completed-this-month count.
 */
export async function getAppointmentStats({ hospitalId, doctorProfileId }) {
  const doctorFilter = doctorProfileId ? { doctorId: doctorProfileId } : {};

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const sevenDaysOut = new Date(now);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [today, upcoming7Days, pending, completedThisMonth] = await Promise.all([
    prisma.appointment.count({ where: { hospitalId, ...doctorFilter, scheduledAt: { gte: todayStart, lt: todayEnd } } }),
    prisma.appointment.count({ where: { hospitalId, ...doctorFilter, scheduledAt: { gte: now, lte: sevenDaysOut } } }),
    prisma.appointment.count({ where: { hospitalId, ...doctorFilter, status: "PENDING" } }),
    prisma.appointment.count({ where: { hospitalId, ...doctorFilter, status: "COMPLETED", scheduledAt: { gte: monthStart } } }),
  ]);

  return { today, upcoming7Days, pending, completedThisMonth };
}

/**
 * Per-day appointment counts for a given month — backs the calendar
 * widget's dot indicators. Returns { "2025-05-20": { CONFIRMED: 3, PENDING: 1 }, ... }
 */
export async function getCalendarSummary({ hospitalId, doctorProfileId, year, month }) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      hospitalId,
      ...(doctorProfileId ? { doctorId: doctorProfileId } : {}),
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
