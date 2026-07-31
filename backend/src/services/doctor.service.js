// Doctor service — backs the Doctor Dashboard: patient list, a single
// patient's overview, and hospital/doctor-scoped alerts.
//
// Access rule threaded through every function here: a DOCTOR only ever
// sees patients assigned to them; a HOSPITAL_ADMIN sees everyone in the
// hospital. Controller passes doctorProfileId only when the caller is a
// DOCTOR (see attachDoctorProfile middleware) — its absence is what makes
// a HOSPITAL_ADMIN's view broader, not a separate code path.

import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { getGlucoseTrends, getPatientTimeline as getTimelineForPatient } from "./log.service.js";

// Status thresholds — same values as alert.service.js, kept in sync
// deliberately since "High"/"Low" on the Patients list should mean the same
// thing as the alerts they'd otherwise trigger. If these ever become
// per-doctor configurable (see Settings screen in the feature blueprint),
// this is the one place that assumption would need to change.
const HIGH_THRESHOLD = 180;
const LOW_THRESHOLD = 70;

// A patient with no glucose reading in this many days is considered
// "Inactive" on the Patients list. Simplified from the mockup's broader
// "no logging activity" definition to just glucose specifically, since
// glucose is the one reading every patient is expected to log daily —
// worth revisiting if a fuller definition (any log type) is wanted later.
const INACTIVE_AFTER_DAYS = 3;

/**
 * Patients list, with status derived from each patient's MOST RECENT
 * glucose reading — "status" isn't a stored column, since it changes with
 * every new log, so it's computed at read time instead.
 *
 * The tricky part is "most recent reading per patient" efficiently across
 * potentially 100+ patients — a naive approach would run one query per
 * patient (N+1). Postgres's DISTINCT ON is built exactly for "latest row
 * per group" and does it in a single query, which is the kind of real SQL
 * feature that was part of the original case for choosing Postgres over
 * Mongo — using $queryRaw here rather than the Prisma query builder, since
 * Prisma doesn't expose DISTINCT ON directly.
 */
export async function listPatients({ hospitalId, doctorProfileId, status, page = 1, pageSize = 20 }) {
  const patientWhere = {
    hospitalId,
    ...(doctorProfileId ? { assignedDoctorId: doctorProfileId } : {}),
  };

  const patients = await prisma.patientProfile.findMany({
    where: patientWhere,
    select: {
      id: true,
      fullName: true,
      dateOfBirth: true,
      gender: true,
      diabetesType: true,
      assignedDoctorId: true,
      user: { select: { email: true } },
    },
    orderBy: { fullName: "asc" },
  });

  if (patients.length === 0) {
    return { patients: [], counts: { all: 0, inRange: 0, high: 0, low: 0, inactive: 0 }, page, pageSize, total: 0 };
  }

  const patientIds = patients.map((p) => p.id);

  // Latest glucose reading per patient, in one query.
  const latestReadings = await prisma.$queryRaw`
    SELECT DISTINCT ON ("patientId") "patientId", "value", "loggedAt"
    FROM "glucose_logs"
    WHERE "patientId" = ANY(${patientIds})
    ORDER BY "patientId", "loggedAt" DESC
  `;

  const latestByPatientId = new Map(latestReadings.map((r) => [r.patientId, r]));
  const inactiveCutoff = new Date();
  inactiveCutoff.setDate(inactiveCutoff.getDate() - INACTIVE_AFTER_DAYS);

  const withStatus = patients.map((patient) => {
    const latest = latestByPatientId.get(patient.id);
    const computedStatus = computeStatus(latest, inactiveCutoff);
    return {
      ...patient,
      currentGlucose: latest?.value ?? null,
      lastUpdated: latest?.loggedAt ?? null,
      status: computedStatus,
    };
  });

  const counts = {
    all: withStatus.length,
    inRange: withStatus.filter((p) => p.status === "IN_RANGE").length,
    high: withStatus.filter((p) => p.status === "HIGH").length,
    low: withStatus.filter((p) => p.status === "LOW").length,
    inactive: withStatus.filter((p) => p.status === "INACTIVE").length,
  };

  const filtered = status ? withStatus.filter((p) => p.status === status) : withStatus;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return { patients: paged, counts, page, pageSize, total: filtered.length };
}

function computeStatus(latestReading, inactiveCutoff) {
  if (!latestReading || new Date(latestReading.loggedAt) < inactiveCutoff) {
    return "INACTIVE";
  }
  if (latestReading.value > HIGH_THRESHOLD) return "HIGH";
  if (latestReading.value < LOW_THRESHOLD) return "LOW";
  return "IN_RANGE";
}

/**
 * Glucose Monitor screen — a doctor viewing one patient's trends. Reuses
 * the exact same computation as the patient's own /glucose-trends endpoint
 * (log.service.js), just gated by the same assigned-patient authorization
 * check used everywhere else on the doctor side.
 */
export async function getPatientGlucoseTrends(patientId, { hospitalId, doctorProfileId, days }) {
  await assertDoctorCanAccessPatient(patientId, { hospitalId, doctorProfileId });
  return getGlucoseTrends(patientId, days);
}

/**
 * Glucose Monitor's "Recent Events" panel — merged glucose/insulin/meal/
 * activity/note timeline for one patient, same authorization gate as above.
 */
export async function getPatientTimeline(patientId, { hospitalId, doctorProfileId, limit }) {
  await assertDoctorCanAccessPatient(patientId, { hospitalId, doctorProfileId });
  return getTimelineForPatient(patientId, { limit });
}

async function assertDoctorCanAccessPatient(patientId, { hospitalId, doctorProfileId }) {
  const patient = await prisma.patientProfile.findFirst({ where: { id: patientId, hospitalId } });
  if (!patient) throw new AppError("Patient not found", 404);
  if (doctorProfileId && patient.assignedDoctorId !== doctorProfileId) {
    throw new AppError("You are not assigned to this patient", 403);
  }
  return patient;
}

export async function getPatientOverview(patientId, { hospitalId, doctorProfileId }) {
  const patient = await assertDoctorCanAccessPatient(patientId, { hospitalId, doctorProfileId });

  const [latestGlucose, recentAlerts, streak, upcomingAppointment] = await Promise.all([
    prisma.glucoseLog.findFirst({ where: { patientId }, orderBy: { loggedAt: "desc" } }),
    prisma.alert.findMany({ where: { patientId, isResolved: false }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.streakRecord.findUnique({ where: { patientId } }),
    prisma.appointment.findFirst({
      where: { patientId, status: "SCHEDULED", scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  return { patient, latestGlucose, recentAlerts, streak, upcomingAppointment };
}

export async function listAlerts({ hospitalId, doctorProfileId }) {
  return prisma.alert.findMany({
    where: {
      hospitalId,
      isResolved: false,
      ...(doctorProfileId ? { patient: { assignedDoctorId: doctorProfileId } } : {}),
    },
    include: { patient: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function resolveAlert(alertId, hospitalId) {
  const alert = await prisma.alert.findFirst({ where: { id: alertId, hospitalId } });
  if (!alert) throw new AppError("Alert not found", 404);
  return prisma.alert.update({ where: { id: alertId }, data: { isResolved: true } });
}
