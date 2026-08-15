// Log service — patient logging (Daily Log screen) + Glucose Trends.
// Every create-log function follows the same shape: write the row, run any
// relevant rule-based alert check, then trigger gamification. That last
// step is centralized in afterLogCreated() so a new log type added later
// can't accidentally forget to wire up streaks/badges.

import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { recordDailyActivity, checkAndAwardBadges } from "./gamification.service.js";
import { checkGlucoseAlert } from "./alert.service.js";

async function afterLogCreated(patientId) {
  await recordDailyActivity(patientId);
  await checkAndAwardBadges(patientId);
}

export async function createGlucoseLog({ patientId, hospitalId, value, context, loggedAt }) {
  const insertData = { patientId, hospitalId, value, context };
  if (loggedAt) {
    insertData.loggedAt = new Date(loggedAt);
  }
  const log = await prisma.glucoseLog.create({ data: insertData });

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

export async function createInsulinLog({ patientId, hospitalId, units, insulinType, reason, loggedAt }) {
  const insertData = { patientId, hospitalId, units, insulinType, reason };
  if (loggedAt) {
    insertData.loggedAt = new Date(loggedAt);
  }
  const log = await prisma.insulinLog.create({ data: insertData });
  await afterLogCreated(patientId);
  return log;
}

export async function updateInsulinLog(logId, patientId, { units, insulinType, reason }) {
  const existing = await prisma.insulinLog.findFirst({ where: { id: logId, patientId } });
  if (!existing) throw new AppError("Insulin log not found", 404);
  return prisma.insulinLog.update({ where: { id: logId }, data: { units, insulinType, reason } });
}

export async function deleteInsulinLog(logId, patientId) {
  const existing = await prisma.insulinLog.findFirst({ where: { id: logId, patientId } });
  if (!existing) throw new AppError("Insulin log not found", 404);
  return prisma.insulinLog.delete({ where: { id: logId } });
}

/**
 * Insulin Records screen: list + summary stats (total daily dose, avg/day,
 * total doses, most-used type, rapid-vs-long split) + a per-day trend for
 * the stacked bar chart. Same pattern as getGlucoseTrends — one function
 * computing everything the screen needs from raw log rows.
 */
export async function getInsulinSummary(patientId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.insulinLog.findMany({
    where: { patientId, loggedAt: { gte: since } },
    orderBy: { loggedAt: "desc" },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTotal = logs
    .filter((l) => new Date(l.loggedAt) >= todayStart)
    .reduce((sum, l) => sum + l.units, 0);

  const totalUnits = logs.reduce((sum, l) => sum + l.units, 0);
  const avgPerDay = days > 0 ? round(totalUnits / days) : 0;

  // "Rapid" / "Long" bucketing is a simple substring match against
  // insulinType — matches the free-text pattern already used for
  // mealType/activityType elsewhere, not a strict enum.
  const isRapid = (l) => {
    const t = (l.insulinType || "").toLowerCase();
    return t.includes("rapid") || t.includes("meal");
  };
  const isLong = (l) => {
    const t = (l.insulinType || "").toLowerCase();
    return t.includes("long") || t.includes("basal");
  };

  const rapidTotal = logs.filter(isRapid).reduce((sum, l) => sum + l.units, 0);
  const longTotal = logs.filter(isLong).reduce((sum, l) => sum + l.units, 0);

  const typeCounts = {};
  for (const log of logs) {
    const key = log.insulinType || "Unspecified";
    typeCounts[key] = (typeCounts[key] || 0) + 1;
  }
  const mostUsedType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Per-day trend for the stacked bar chart — grouped by calendar day.
  const dailyTotals = {};
  for (const log of logs) {
    const dayKey = new Date(log.loggedAt).toISOString().slice(0, 10);
    dailyTotals[dayKey] = dailyTotals[dayKey] || { rapid: 0, long: 0 };
    if (isRapid(log)) dailyTotals[dayKey].rapid += log.units;
    else if (isLong(log)) dailyTotals[dayKey].long += log.units;
  }
  const dailyTrend = Object.entries(dailyTotals)
    .map(([date, totals]) => ({ date, ...totals }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    logs,
    stats: {
      totalDailyDose: round(todayTotal),
      avgPerDay,
      totalDoses: logs.length,
      mostUsedType,
    },
    breakdown: { rapidTotal: round(rapidTotal), longTotal: round(longTotal) },
    dailyTrend,
  };
}

export async function createMealLog({ patientId, hospitalId, carbs, mealType, notes, loggedAt }) {
  const insertData = { patientId, hospitalId, carbs, mealType, notes };
  if (loggedAt) {
    insertData.loggedAt = new Date(loggedAt);
  }
  const log = await prisma.mealLog.create({ data: insertData });
  await afterLogCreated(patientId);
  return log;
}

export async function createActivityLog({ patientId, hospitalId, durationMins, activityType, loggedAt }) {
  const insertData = { patientId, hospitalId, durationMins, activityType };
  if (loggedAt) {
    insertData.loggedAt = new Date(loggedAt);
  }
  const log = await prisma.activityLog.create({ data: insertData });
  await afterLogCreated(patientId);
  return log;
}

export async function updateActivityLog(logId, patientId, { durationMins, activityType }) {
  const existing = await prisma.activityLog.findFirst({ where: { id: logId, patientId } });
  if (!existing) throw new AppError("Activity log not found", 404);
  return prisma.activityLog.update({ where: { id: logId }, data: { durationMins, activityType } });
}

export async function deleteActivityLog(logId, patientId) {
  const existing = await prisma.activityLog.findFirst({ where: { id: logId, patientId } });
  if (!existing) throw new AppError("Activity log not found", 404);
  return prisma.activityLog.delete({ where: { id: logId } });
}

/**
 * Activity screen summary. Duration-only, deliberately — steps and
 * calories don't exist in the schema (see blueprint: both are blocked on
 * a device-integration/estimation-method decision that hasn't been made).
 * This computes everything that CAN be answered from what's actually
 * logged: total time, breakdown by activity type, a weekly trend against
 * the patient's goal, and which day was most active.
 */
export async function getActivitySummary(patientId, weeklyGoalMins = 150) {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const logs = await prisma.activityLog.findMany({
    where: { patientId, loggedAt: { gte: since } },
    orderBy: { loggedAt: "desc" },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTotal = logs
    .filter((l) => new Date(l.loggedAt) >= todayStart)
    .reduce((sum, l) => sum + l.durationMins, 0);

  const weekTotal = logs.reduce((sum, l) => sum + l.durationMins, 0);

  const byType = {};
  for (const log of logs) {
    const key = log.activityType || "Other";
    byType[key] = (byType[key] || 0) + log.durationMins;
  }
  const breakdown = Object.entries(byType).map(([activityType, mins]) => ({ activityType, mins }));

  const byDay = {};
  for (const log of logs) {
    const dayKey = new Date(log.loggedAt).toISOString().slice(0, 10);
    byDay[dayKey] = (byDay[dayKey] || 0) + log.durationMins;
  }
  const dailyTrend = Object.entries(byDay)
    .map(([date, mins]) => ({ date, mins }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const mostActiveDay = dailyTrend.length
    ? dailyTrend.reduce((max, day) => (day.mins > max.mins ? day : max))
    : null;

  return {
    logs,
    stats: {
      todayTotalMins: todayTotal,
      weekTotalMins: weekTotal,
      weeklyGoalMins,
      weeklyProgressPercent: weeklyGoalMins > 0 ? round((weekTotal / weeklyGoalMins) * 100) : 0,
    },
    breakdown,
    dailyTrend,
    mostActiveDay,
  };
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

export async function getPatient7DayReportData(patientId) {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  since.setHours(0, 0, 0, 0);

  const [patient, glucose, insulin, meals, activity, notes, glucoseTrends] = await Promise.all([
    prisma.patientProfile.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { email: true, phone: true } },
        hospital: { select: { name: true } },
        doctor: { select: { fullName: true } },
      },
    }),
    prisma.glucoseLog.findMany({ where: { patientId, loggedAt: { gte: since } }, orderBy: { loggedAt: "asc" } }),
    prisma.insulinLog.findMany({ where: { patientId, loggedAt: { gte: since } }, orderBy: { loggedAt: "asc" } }),
    prisma.mealLog.findMany({ where: { patientId, loggedAt: { gte: since } }, orderBy: { loggedAt: "asc" } }),
    prisma.activityLog.findMany({ where: { patientId, loggedAt: { gte: since } }, orderBy: { loggedAt: "asc" } }),
    prisma.patientNote.findMany({ where: { patientId, loggedAt: { gte: since } }, orderBy: { loggedAt: "asc" } }),
    getGlucoseTrends(patientId, 7),
  ]);

  if (!patient) {
    throw new Error("Patient profile not found");
  }

  return {
    patient: {
      fullName: patient.fullName,
      email: patient.user?.email || "",
      phone: patient.user?.phone || "",
      hospitalName: patient.hospital?.name || "",
      doctorName: patient.doctor?.fullName || "",
      diabetesType: patient.diabetesType || "",
      gender: patient.gender || "",
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.toISOString().slice(0, 10) : "",
    },
    trends: glucoseTrends,
    logs: {
      glucose,
      insulin,
      meals,
      activity,
      notes,
    },
  };
}
