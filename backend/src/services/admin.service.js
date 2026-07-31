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

export async function createHospital({ name, address, contactEmail, contactPhone }) {
  return prisma.hospital.create({ data: { name, address, contactEmail, contactPhone } });
}

export async function listDoctors(hospitalId) {
  return prisma.doctorProfile.findMany({
    where: { hospitalId },
    select: { id: true, fullName: true, specialization: true, user: { select: { email: true } } },
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
