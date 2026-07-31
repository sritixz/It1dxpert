// attachPatientProfile / attachDoctorProfile — run AFTER authenticate.
//
// req.auth.userId is the User row's id (the auth identity). But logs,
// medications, etc. are all keyed off PatientProfile.id / DoctorProfile.id
// (the profile row, which holds the actual clinical/professional fields) —
// deliberately kept as a separate table from User (see schema comments).
// This middleware bridges that gap once per request so controllers never
// have to look it up themselves.

import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export async function attachPatientProfile(req, res, next) {
  const profile = await prisma.patientProfile.findUnique({ where: { userId: req.auth.userId } });
  if (!profile) {
    return next(new AppError("Patient profile not found for this account", 404));
  }
  req.patientProfileId = profile.id;
  next();
}

// Only DOCTOR accounts have a doctor profile — HOSPITAL_ADMIN shares this
// route group but has no DoctorProfile row, so req.doctorProfileId is left
// undefined for them. Controllers use "is doctorProfileId set?" to decide
// "scope to just this doctor's patients" vs "show the whole hospital".
export async function attachDoctorProfile(req, res, next) {
  if (req.auth.role !== "DOCTOR") {
    return next();
  }
  const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.auth.userId } });
  if (!profile) {
    return next(new AppError("Doctor profile not found for this account", 404));
  }
  req.doctorProfileId = profile.id;
  next();
}
