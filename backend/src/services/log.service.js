// Log service — patient logging (Daily Log screen) + Glucose Trends.
// Every create-log function follows the same shape: write the row, run any
// relevant rule-based alert check, then trigger gamification. That last
// step is centralized in afterLogCreated() so a new log type added later
// can't accidentally forget to wire up streaks/badges.

import { prisma } from "../config/db.js";
import { recordDailyActivity, checkAndAwardBadges } from "./gamification.service.js";
import { checkGlucoseAlert } from "./alert.service.js";

async function afterLogCreated(patientId) {
  await recordDailyActivity(patientId);
  await checkAndAwardBadges(patientId);
}

export async function createGlucoseLog({ patientId, hospitalId, value, context }) {
  const log = await prisma.glucoseLog.create({ data: { patientId, hospitalId, value, context } });

  // Per-doctor configurable thresholds (Settings screen) — look up the
  // patient's assigned doctor's custom values, if any, and fall back to
  // the platform defaults inside checkGlucoseAlert when they haven't set
  // any. One extra query per glucose log; acceptable for this data volume.
  const thresholds = await getThresholdsForPatient(patientId);
  const alertInfo = checkGlucoseAlert(value, thresholds);
  if (alertInfo) {
    await prisma.alert.create({ data: { patientId, hospitalId, ...alertInfo } });
  }

  await afterLogCreated(patientId);
  return log;
}

async function getThresholdsForPatient(patientId) {
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    select: {
      assignedDoctor: {
        select: {
          highGlucoseThreshold: true,
          lowGlucoseThreshold: true,
          urgentHighThreshold: true,
          urgentLowThreshold: true,
        },
      },
    },
  });

  const doctorThresholds = patient?.assignedDoctor;
  if (!doctorThresholds) return {};

  // Only override fields the doctor actually set — null fields fall
  // through to DEFAULT_THRESHOLDS inside checkGlucoseAlert.
  return {
    ...(doctorThresholds.highGlucoseThreshold != null && { high: doctorThresholds.highGlucoseThreshold }),
    ...(doctorThresholds.lowGlucoseThreshold != null && { low: doctorThresholds.lowGlucoseThreshold }),
    ...(doctorThresholds.urgentHighThreshold != null && { urgentHigh: doctorThresholds.urgentHighThreshold }),
    ...(doctorThresholds.urgentLowThreshold != null && { urgentLow: doctorThresholds.urgentLowThreshold }),
  };
}

export async function createInsulinLog({ patientId, hospitalId, units, insulinType }) {
  const log = await prisma.insulinLog.create({ data: { patientId, hospitalId, units, insulinType } });
  await afterLogCreated(patientId);
  return log;
}

export async function createMealLog({ patientId, hospitalId, carbs, mealType, notes }) {
  const log = await prisma.mealLog.create({ data: { patientId, hospitalId, carbs, mealType, notes } });
  await afterLogCreated(patientId);
  return log;
}

export async function createActivityLog({ patientId, hospitalId, durationMins, activityType }) {
  const log = await prisma.activityLog.create({ data: { patientId, hospitalId, durationMins, activityType } });
  await afterLogCreated(patientId);
  return log;
}

// Free-text notes (e.g. "felt tired in the evening") — deliberately NOT
// wired into afterLogCreated/gamification. A note isn't one of the four
// tracked categories (glucose/insulin/meal/activity), so it shouldn't count
// toward a streak or the "logged everything today" badge — that would let
// a note substitute for actual data, which undermines what the badge is
// supposed to reward.
export async function createNote({ patientId, hospitalId, content }) {
  return prisma.patientNote.create({ data: { patientId, hospitalId, content } });
}

/**
 * Daily Log screen: all 4 log types for one calendar day, plus the daily
 * aggregate summary shown at the top/bottom of that screen in the mockup.
 */
export async function getDailyLog(patientId, dateStr) {
  const { start, end } = dayBounds(dateStr);
  const range = { patientId, loggedAt: { gte: start, lt: end } };

  const [glucose, insulin, meals, activity] = await Promise.all([
    prisma.glucoseLog.findMany({ where: range, orderBy: { loggedAt: "asc" } }),
    prisma.insulinLog.findMany({ where: range, orderBy: { loggedAt: "asc" } }),
    prisma.mealLog.findMany({ where: range, orderBy: { loggedAt: "asc" } }),
    prisma.activityLog.findMany({ where: range, orderBy: { loggedAt: "asc" } }),
  ]);

  return {
    date: dateStr,
    glucose,
    insulin,
    meals,
    activity,
    summary: {
      avgGlucose: round(average(glucose.map((g) => g.value))),
      totalCarbs: sum(meals.map((m) => m.carbs)),
      totalInsulin: sum(insulin.map((i) => i.units)),
      totalActivityMins: sum(activity.map((a) => a.durationMins)),
    },
  };
}

/**
 * Glucose Trends screen: stats + time series + insight percentages,
 * matching the mockup (avg/high/low/std-dev, in-range %, GMI, time-in-range).
 *
 * Note on GMI: this is the standard, published Glucose Management Indicator
 * formula (a fixed arithmetic conversion from average glucose — the same
 * one CGM apps like Dexcom/Libre display). It is deterministic math, not a
 * prediction model, so it doesn't fall under the AI-advisory boundary we
 * agreed to avoid — flagging that explicitly since "estimates HbA1c" can
 * sound like it crosses that line at a glance.
 */
export async function getGlucoseTrends(patientId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.glucoseLog.findMany({
    where: { patientId, loggedAt: { gte: since } },
    orderBy: { loggedAt: "asc" },
  });

  const values = logs.map((l) => l.value);
  const TARGET_LOW = 70;
  const TARGET_HIGH = 180;
  const total = values.length || 1; // avoid divide-by-zero when there's no data yet

  const inRangeCount = values.filter((v) => v >= TARGET_LOW && v <= TARGET_HIGH).length;
  const highCount = values.filter((v) => v > TARGET_HIGH).length;
  const lowCount = values.filter((v) => v < TARGET_LOW).length;

  return {
    rangeDays: days,
    series: logs.map((l) => ({ value: l.value, loggedAt: l.loggedAt, context: l.context })),
    stats: {
      average: round(average(values)),
      highest: values.length ? Math.max(...values) : null,
      lowest: values.length ? Math.min(...values) : null,
      stdDeviation: round(stdDev(values)),
      // Coefficient of Variation — standard glycemic-variability metric
      // (stdDev ÷ mean × 100). Deterministic arithmetic, same category as
      // GMI below: not a prediction, just a different way of summarizing
      // the same logged numbers.
      coefficientOfVariation: values.length && average(values) > 0
        ? round((stdDev(values) / average(values)) * 100)
        : null,
    },
    insights: {
      inRangePercent: round((inRangeCount / total) * 100),
      highPercent: round((highCount / total) * 100),
      lowPercent: round((lowCount / total) * 100),
      gmi: values.length ? round(3.31 + 0.02392 * average(values)) : null,
    },
  };
}

/**
 * Merged, chronological event timeline — backs the Glucose Monitor screen's
 * "Recent Events" panel (meals, insulin, activity, and notes together,
 * newest first). Currently 4 separate tables with no shared "event" concept,
 * so this fetches each type independently and merges/sorts in application
 * code rather than a single query — fine at this data volume; if a hospital's
 * patients accumulate very large histories, this is the first place worth
 * revisiting (e.g. a shared events table, or a UNION query).
 */
export async function getPatientTimeline(patientId, { limit = 20 } = {}) {
  const [glucose, insulin, meals, activity, notes] = await Promise.all([
    prisma.glucoseLog.findMany({ where: { patientId }, orderBy: { loggedAt: "desc" }, take: limit }),
    prisma.insulinLog.findMany({ where: { patientId }, orderBy: { loggedAt: "desc" }, take: limit }),
    prisma.mealLog.findMany({ where: { patientId }, orderBy: { loggedAt: "desc" }, take: limit }),
    prisma.activityLog.findMany({ where: { patientId }, orderBy: { loggedAt: "desc" }, take: limit }),
    prisma.patientNote.findMany({ where: { patientId }, orderBy: { loggedAt: "desc" }, take: limit }),
  ]);

  const events = [
    ...glucose.map((g) => ({ type: "GLUCOSE", at: g.loggedAt, data: { value: g.value, context: g.context } })),
    ...insulin.map((i) => ({ type: "INSULIN", at: i.loggedAt, data: { units: i.units, insulinType: i.insulinType } })),
    ...meals.map((m) => ({ type: "MEAL", at: m.loggedAt, data: { carbs: m.carbs, mealType: m.mealType } })),
    ...activity.map((a) => ({ type: "ACTIVITY", at: a.loggedAt, data: { durationMins: a.durationMins, activityType: a.activityType } })),
    ...notes.map((n) => ({ type: "NOTE", at: n.loggedAt, data: { content: n.content } })),
  ];

  events.sort((a, b) => new Date(b.at) - new Date(a.at));
  return events.slice(0, limit);
}


function dayBounds(dateStr) {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}
function average(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}
function stdDev(arr) {
  if (arr.length < 2) return 0;
  const avg = average(arr);
  return Math.sqrt(average(arr.map((v) => (v - avg) ** 2)));
}
function round(n) {
  return Math.round(n * 10) / 10;
}
