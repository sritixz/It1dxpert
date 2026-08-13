// Patient controller — thin validation + service-call layer, same pattern
// as auth.controller.js. req.patientProfileId and req.hospitalId are set
// by attachPatientProfile / scopeToHospital middleware before any of these
// run (see patient.routes.js) — never trusted from the request body.

import { z } from "zod";
import { prisma } from "../config/db.js";
import * as logService from "../services/log.service.js";
import * as medicationService from "../services/medication.service.js";

const glucoseSchema = z.object({ value: z.number().positive(), context: z.string().optional(), loggedAt: z.string().optional() });
const insulinSchema = z.object({ units: z.number().positive(), insulinType: z.string().optional(), reason: z.string().optional(), loggedAt: z.string().optional() });
const insulinUpdateSchema = insulinSchema.partial();
const mealSchema = z.object({ carbs: z.number().nonnegative(), mealType: z.string().optional(), notes: z.string().optional(), loggedAt: z.string().optional() });
const activitySchema = z.object({ durationMins: z.number().int().positive(), activityType: z.string().optional(), loggedAt: z.string().optional() });
const activityUpdateSchema = activitySchema.partial();
const noteSchema = z.object({ content: z.string().min(1).max(1000) });

const medicationSchema = z.object({
  name: z.string().min(1),
  dose: z.string().min(1),
  frequency: z.string().min(1),
  scheduledTimes: z.array(z.string()).default([]),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

const doseSchema = z.object({
  medicationId: z.string().uuid(),
  status: z.enum(["TAKEN", "MISSED"]).default("TAKEN"),
  scheduledFor: z.string().optional(),
});

// --- Logging ---

export async function logGlucoseController(req, res) {
  const data = glucoseSchema.parse(req.body);
  const log = await logService.createGlucoseLog({ patientId: req.patientProfileId, hospitalId: req.hospitalId, ...data });
  res.status(201).json({ success: true, data: log });
}

export async function logInsulinController(req, res) {
  const data = insulinSchema.parse(req.body);
  const log = await logService.createInsulinLog({ patientId: req.patientProfileId, hospitalId: req.hospitalId, ...data });
  res.status(201).json({ success: true, data: log });
}

// Insulin Records screen
export async function listInsulinLogsController(req, res) {
  const days = Number(req.query.days) || 7;
  const data = await logService.getInsulinSummary(req.patientProfileId, days);
  res.json({ success: true, data });
}

export async function updateInsulinLogController(req, res) {
  const data = insulinUpdateSchema.parse(req.body);
  const log = await logService.updateInsulinLog(req.params.logId, req.patientProfileId, data);
  res.json({ success: true, data: log });
}

export async function deleteInsulinLogController(req, res) {
  await logService.deleteInsulinLog(req.params.logId, req.patientProfileId);
  res.json({ success: true, data: null });
}

export async function logMealController(req, res) {
  const data = mealSchema.parse(req.body);
  const log = await logService.createMealLog({ patientId: req.patientProfileId, hospitalId: req.hospitalId, ...data });
  res.status(201).json({ success: true, data: log });
}

export async function logActivityController(req, res) {
  const data = activitySchema.parse(req.body);
  const log = await logService.createActivityLog({ patientId: req.patientProfileId, hospitalId: req.hospitalId, ...data });
  res.status(201).json({ success: true, data: log });
}

// Activity screen — duration-only, deliberately (steps/calories blocked
// on the device-integration decision, see log.service.js's getActivitySummary comment)
export async function getActivitySummaryController(req, res) {
  const patient = await prisma.patientProfile.findUnique({
    where: { id: req.patientProfileId },
    select: { weeklyActivityGoalMins: true },
  });
  const data = await logService.getActivitySummary(req.patientProfileId, patient?.weeklyActivityGoalMins);
  res.json({ success: true, data });
}

export async function updateActivityLogController(req, res) {
  const data = activityUpdateSchema.parse(req.body);
  const log = await logService.updateActivityLog(req.params.logId, req.patientProfileId, data);
  res.json({ success: true, data: log });
}

export async function deleteActivityLogController(req, res) {
  await logService.deleteActivityLog(req.params.logId, req.patientProfileId);
  res.json({ success: true, data: null });
}

// Free-text note — shows up in the doctor's merged event timeline
// (Glucose Monitor screen's "Recent Events" panel) but deliberately isn't
// wired into gamification (see log.service.js's createNote comment).
export async function logNoteController(req, res) {
  const data = noteSchema.parse(req.body);
  const note = await logService.createNote({ patientId: req.patientProfileId, hospitalId: req.hospitalId, ...data });
  res.status(201).json({ success: true, data: note });
}

// --- Daily Log / Glucose Trends ---

export async function getDailyLogController(req, res) {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const data = await logService.getDailyLog(req.patientProfileId, date);
  res.json({ success: true, data });
}

export async function getGlucoseTrendsController(req, res) {
  const days = Number(req.query.days) || 7;
  const data = await logService.getGlucoseTrends(req.patientProfileId, days);
  res.json({ success: true, data });
}

// --- Medications ---

export async function createMedicationController(req, res) {
  const data = medicationSchema.parse(req.body);
  const medication = await medicationService.createMedication({
    patientId: req.patientProfileId,
    hospitalId: req.hospitalId,
    ...data,
  });
  res.status(201).json({ success: true, data: medication });
}

export async function listMedicationsController(req, res) {
  const meds = await medicationService.listMedications(req.patientProfileId);
  res.json({ success: true, data: meds });
}

export async function logDoseController(req, res) {
  const data = doseSchema.parse(req.body);
  const dose = await medicationService.logMedicationDose({ ...data, patientId: req.patientProfileId });
  res.status(201).json({ success: true, data: dose });
}

export async function getAdherenceController(req, res) {
  const days = Number(req.query.days) || 7;
  const data = await medicationService.getAdherence(req.patientProfileId, days);
  res.json({ success: true, data });
}

// --- Gamification ---

export async function getGamificationStatusController(req, res) {
  const [streak, earnedBadges] = await Promise.all([
    prisma.streakRecord.findUnique({ where: { patientId: req.patientProfileId } }),
    prisma.patientBadge.findMany({
      where: { patientId: req.patientProfileId },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    }),
  ]);

  res.json({
    success: true,
    data: {
      streak: streak || { currentStreak: 0, longestStreak: 0, lastLoggedDate: null },
      badges: earnedBadges,
    },
  });
}
