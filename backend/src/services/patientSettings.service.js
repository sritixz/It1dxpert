// Patient settings service. Deliberately scoped to what was agreed as
// "the non-device parts" — personal info, password change, emergency
// contact, unit/timezone/language/theme preferences, and CSV export.
// NOT built here, on purpose: Connected Devices (the CGM/device-
// integration decision, flagged repeatedly and still unresolved) and
// Delete Account (needs a real conversation with PGI Chandigarh about
// what "delete" means for a hospital-partnered medical record — hard
// delete vs. anonymize vs. retain-then-delete — not something to decide
// unilaterally in code).

import { prisma } from "../config/db.js";

export async function getSettings(patientProfileId) {
  return prisma.patientProfile.findUnique({
    where: { id: patientProfileId },
    include: { user: { select: { email: true, phone: true } } },
  });
}

export async function updateProfile(patientProfileId, { fullName, phone }) {
  const profile = await prisma.patientProfile.update({
    where: { id: patientProfileId },
    data: { fullName },
  });

  if (phone) {
    await prisma.user.update({ where: { id: profile.userId }, data: { phone } });
  }

  return profile;
}

export async function updateEmergencyContact(patientProfileId, { emergencyContactName, emergencyContactPhone, emergencyContactRelation }) {
  return prisma.patientProfile.update({
    where: { id: patientProfileId },
    data: { emergencyContactName, emergencyContactPhone, emergencyContactRelation },
  });
}

export async function updatePreferences(patientProfileId, { preferredUnits, timezone, language, theme }) {
  return prisma.patientProfile.update({
    where: { id: patientProfileId },
    data: { preferredUnits, timezone, language, theme },
  });
}

/**
 * CSV export of everything a patient has logged — glucose, insulin,
 * meals, activity, notes — one row per log entry across all types,
 * sorted chronologically. Built by hand (string-joining, no CSV library)
 * since the data is simple and flat; a library would be overkill for
 * this shape.
 */
export async function exportDataAsCsv(patientProfileId) {
  const [glucose, insulin, meals, activity, notes] = await Promise.all([
    prisma.glucoseLog.findMany({ where: { patientId: patientProfileId } }),
    prisma.insulinLog.findMany({ where: { patientId: patientProfileId } }),
    prisma.mealLog.findMany({ where: { patientId: patientProfileId } }),
    prisma.activityLog.findMany({ where: { patientId: patientProfileId } }),
    prisma.patientNote.findMany({ where: { patientId: patientProfileId } }),
  ]);

  const rows = [
    ["Type", "Date/Time", "Value", "Detail 1", "Detail 2"],
    ...glucose.map((g) => ["Glucose", g.loggedAt.toISOString(), `${g.value} mg/dL`, g.context || "", ""]),
    ...insulin.map((i) => ["Insulin", i.loggedAt.toISOString(), `${i.units} units`, i.insulinType || "", i.reason || ""]),
    ...meals.map((m) => ["Meal", m.loggedAt.toISOString(), `${m.carbs} g carbs`, m.mealType || "", m.notes || ""]),
    ...activity.map((a) => ["Activity", a.loggedAt.toISOString(), `${a.durationMins} min`, a.activityType || "", ""]),
    ...notes.map((n) => ["Note", n.loggedAt.toISOString(), n.content, "", ""]),
  ];

  // Basic CSV escaping — wraps any field containing a comma/quote/newline
  // in quotes and doubles internal quotes, per the standard CSV convention.
  return rows
    .map((row) => row.map(escapeCsvField).join(","))
    .join("\n");
}

function escapeCsvField(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
