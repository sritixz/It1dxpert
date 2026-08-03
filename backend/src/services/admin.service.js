// Admin service. Two creation flows kept deliberately separate by scope:
// - createDoctor: HOSPITAL_ADMIN creates a doctor within THEIR OWN
//   hospital (hospitalId is forced by the caller from req.hospitalId,
//   never taken from the request body).
// - createHospitalAdmin / createHospital: SUPER_ADMIN only, since these
//   operate above a single hospital's scope.
//
// This mirrors the invite-based decision made earlier: doctors and admins
// are provisioned by someone with authority over that scope, not via open
// self-registration — that's what keeps hospital-scoping trustworthy.

import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

const SALT_ROUNDS = 12;

export async function createDoctor({ email, password, fullName, specialization, licenseNumber, hospitalId }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("An account with this email already exists", 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email, passwordHash, role: "DOCTOR", hospitalId } });
    const profile = await tx.doctorProfile.create({
      data: { userId: user.id, hospitalId, fullName, specialization, licenseNumber },
    });
    return { user: { id: user.id, email: user.email }, profile };
  });
}

export async function createHospitalAdmin({ email, password, hospitalId }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("An account with this email already exists", 409);

  const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
  if (!hospital) throw new AppError("Hospital not found", 404);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({ data: { email, passwordHash, role: "HOSPITAL_ADMIN", hospitalId } });
  return { id: user.id, email: user.email, hospitalId: user.hospitalId };
}

export async function createHospital({ name, type, address, contactEmail, contactPhone }) {
  return prisma.hospital.create({ data: { name, type, address, contactEmail, contactPhone } });
}

// hospitalId null = SUPER_ADMIN viewing all doctors platform-wide;
// hospitalId set = scoped to one hospital (HOSPITAL_ADMIN, or SUPER_ADMIN
// drilling into a specific hospital).
export async function listDoctors(hospitalId) {
  return prisma.doctorProfile.findMany({
    where: hospitalId ? { hospitalId } : {},
    select: {
      id: true, fullName: true, specialization: true, createdAt: true,
      hospital: { select: { name: true } },
      user: { select: { email: true, phone: true, isActive: true } },
    },
    orderBy: { fullName: "asc" },
  });
}

export async function assignPatientToDoctor({ patientId, doctorId, hospitalId }) {
  const [patient, doctor] = await Promise.all([
    prisma.patientProfile.findFirst({ where: { id: patientId, hospitalId } }),
    prisma.doctorProfile.findFirst({ where: { id: doctorId, hospitalId } }),
  ]);
  if (!patient || !doctor) {
    throw new AppError("Patient or doctor not found in this hospital", 404);
  }

  return prisma.patientProfile.update({ where: { id: patientId }, data: { assignedDoctorId: doctorId } });
}

// -----------------------------------------------------------------------
// Hospitals / Clinics screen
// -----------------------------------------------------------------------

/**
 * hospitalId null = SUPER_ADMIN sees every hospital on the platform.
 * hospitalId set = HOSPITAL_ADMIN sees only their own (a list of one).
 * Same scoping pattern used everywhere else — the screen doesn't need to
 * know or care which case it's in, it just renders whatever comes back.
 */
export async function listHospitals(hospitalId) {
  const hospitals = await prisma.hospital.findMany({
    where: hospitalId ? { id: hospitalId } : {},
    include: { _count: { select: { patients: true, doctors: true } } },
    orderBy: { createdAt: "desc" },
  });

  return hospitals.map((h) => ({
    ...h,
    patientCount: h._count.patients,
    doctorCount: h._count.doctors,
    _count: undefined,
  }));
}

export async function getHospitalDetail(hospitalId) {
  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId },
    include: { _count: { select: { patients: true, doctors: true } } },
  });
  if (!hospital) throw new AppError("Hospital not found", 404);
  return { ...hospital, patientCount: hospital._count.patients, doctorCount: hospital._count.doctors, _count: undefined };
}

// SUPER_ADMIN only (enforced at the route level) — a HOSPITAL_ADMIN
// shouldn't be able to rename their own hospital or change its contact
// details unilaterally; that's platform-level administration.
export async function updateHospital(hospitalId, { name, type, address, contactEmail, contactPhone, isActive }) {
  const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
  if (!hospital) throw new AppError("Hospital not found", 404);
  return prisma.hospital.update({ where: { id: hospitalId }, data: { name, type, address, contactEmail, contactPhone, isActive } });
}

// -----------------------------------------------------------------------
// Users & Roles screen — scoped to the 4 roles that actually exist
// (SUPER_ADMIN, HOSPITAL_ADMIN, DOCTOR, PATIENT). The reference mockup
// showed 8 roles (Nurse, Data Operator, Clinic Manager, Auditor...) —
// deliberately not implemented here; adding new roles is an RBAC
// expansion (new authorization rules, real access decisions), not a UI
// change, and wasn't part of this round's scope.
// -----------------------------------------------------------------------

/**
 * Lists users across all 4 roles, with search across email + profile name
 * (patient/doctor full name, since that's where the display name actually
 * lives — see the schema's User/PatientProfile/DoctorProfile split).
 */
export async function listUsers({ hospitalId, role, status, search, page = 1, pageSize = 20 }) {
  const where = {
    ...(hospitalId ? { hospitalId } : {}),
    ...(role ? { role } : {}),
    ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { patientProfile: { fullName: { contains: search, mode: "insensitive" } } },
            { doctorProfile: { fullName: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [users, total, counts] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, phone: true, role: true, isActive: true, lastLoginAt: true, createdAt: true,
        hospital: { select: { name: true } },
        patientProfile: { select: { fullName: true } },
        doctorProfile: { select: { fullName: true, specialization: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
    getUserCounts(hospitalId),
  ]);

  return { users, total, page, pageSize, counts };
}

async function getUserCounts(hospitalId) {
  const base = hospitalId ? { hospitalId } : {};
  const [total, active, inactive, patients, doctors, hospitalAdmins] = await Promise.all([
    prisma.user.count({ where: base }),
    prisma.user.count({ where: { ...base, isActive: true } }),
    prisma.user.count({ where: { ...base, isActive: false } }),
    prisma.user.count({ where: { ...base, role: "PATIENT" } }),
    prisma.user.count({ where: { ...base, role: "DOCTOR" } }),
    prisma.user.count({ where: { ...base, role: "HOSPITAL_ADMIN" } }),
  ]);
  return { total, active, inactive, patients, doctors, hospitalAdmins };
}

export async function setUserActive(userId, hospitalId, isActive) {
  const where = hospitalId ? { id: userId, hospitalId } : { id: userId };
  const user = await prisma.user.findFirst({ where });
  if (!user) throw new AppError("User not found", 404);
  return prisma.user.update({ where: { id: userId }, data: { isActive } });
}

// -----------------------------------------------------------------------
// Admin Dashboard — real numbers only. Deliberately no fake "System
// Health" panel (no real server/database monitoring wired up) and no
// approval-queue data (that workflow doesn't exist — patients self-
// register and doctors are created directly, both active immediately).
// -----------------------------------------------------------------------

export async function getDashboardStats(hospitalId) {
  const scoped = hospitalId ? { hospitalId } : {};
  const since7Days = new Date();
  since7Days.setDate(since7Days.getDate() - 7);

  const [totalPatients, totalDoctors, totalHospitals, activeUsers7Days, alertsTriggered7Days, recentPatients, recentDoctors, counts] =
    await Promise.all([
      prisma.patientProfile.count({ where: scoped }),
      prisma.doctorProfile.count({ where: scoped }),
      hospitalId ? Promise.resolve(1) : prisma.hospital.count(),
      prisma.user.count({ where: { ...scoped, lastLoginAt: { gte: since7Days } } }),
      prisma.alert.count({ where: { ...scoped, createdAt: { gte: since7Days } } }),
      prisma.patientProfile.findMany({
        where: scoped,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, fullName: true, createdAt: true, user: { select: { isActive: true } } },
      }),
      prisma.doctorProfile.findMany({
        where: scoped,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, fullName: true, specialization: true, createdAt: true, user: { select: { isActive: true } } },
      }),
      getUserCounts(hospitalId),
    ]);

  return { totalPatients, totalDoctors, totalHospitals, activeUsers7Days, alertsTriggered7Days, recentPatients, recentDoctors, roleCounts: counts };
}

/**
 * Daily patient-registration counts for the last N days, with zero-filled
 * gaps (a day with no registrations shows 0, not a missing point) — backs
 * the Dashboard's registration trend chart.
 */
export async function getRegistrationTrend(hospitalId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const patients = await prisma.patientProfile.findMany({
    where: { ...(hospitalId ? { hospitalId } : {}), createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const byDay = {};
  for (const p of patients) {
    const key = p.createdAt.toISOString().slice(0, 10);
    byDay[key] = (byDay[key] || 0) + 1;
  }

  const trend = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    trend.push({ date: key, count: byDay[key] || 0 });
  }
  return trend;
}
