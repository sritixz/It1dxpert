// Gamification — streaks + badges, tied directly to logging behavior as
// discussed: reward CONSISTENCY (daily streaks, same-day completeness),
// not raw volume, so the incentive lines up with data quality rather than
// encouraging junk entries just to keep a streak alive.

import { prisma } from "../config/db.js";

// Badge codes referenced here must exist as rows in the `badges` table
// (seeded in prisma/seed.js). Using a stable `code` — not the DB id — to
// refer to them means the seed data's name/description/icon can be edited
// freely without touching this logic.
const BADGE_CODES = {
  STREAK_3: "STREAK_3",
  STREAK_7: "STREAK_7",
  STREAK_30: "STREAK_30",
  COMPLETE_DAY: "COMPLETE_DAY",
};

/**
 * Called after ANY log is created (glucose/insulin/meal/activity).
 * Updates the patient's streak:
 * - already logged today -> no change (streak doesn't double-count same day)
 * - logged yesterday -> streak continues, +1
 * - any bigger gap, or first-ever log -> streak resets to 1
 */
export async function recordDailyActivity(patientId) {
  const today = startOfDay(new Date());
  const existing = await prisma.streakRecord.findUnique({ where: { patientId } });

  if (!existing) {
    return prisma.streakRecord.create({
      data: { patientId, currentStreak: 1, longestStreak: 1, lastLoggedDate: today },
    });
  }

  const lastLogged = existing.lastLoggedDate ? startOfDay(existing.lastLoggedDate) : null;

  if (lastLogged && sameDay(lastLogged, today)) {
    return existing; // already counted today
  }

  const isConsecutiveDay = lastLogged && daysBetween(lastLogged, today) === 1;
  const newCurrent = isConsecutiveDay ? existing.currentStreak + 1 : 1;

  return prisma.streakRecord.update({
    where: { patientId },
    data: {
      currentStreak: newCurrent,
      longestStreak: Math.max(newCurrent, existing.longestStreak),
      lastLoggedDate: today,
    },
  });
}

/**
 * Checks streak length + same-day completeness against badge criteria and
 * awards any newly-earned badges. Safe to call after every log — awarding
 * an already-earned badge is silently skipped via the DB's unique
 * constraint rather than a manual "already has it?" check.
 */
export async function checkAndAwardBadges(patientId) {
  const streak = await prisma.streakRecord.findUnique({ where: { patientId } });
  const toAward = [];

  if (streak) {
    if (streak.currentStreak >= 3) toAward.push(BADGE_CODES.STREAK_3);
    if (streak.currentStreak >= 7) toAward.push(BADGE_CODES.STREAK_7);
    if (streak.currentStreak >= 30) toAward.push(BADGE_CODES.STREAK_30);
  }

  if (await loggedAllCategoriesToday(patientId)) {
    toAward.push(BADGE_CODES.COMPLETE_DAY);
  }

  const awarded = [];
  for (const code of toAward) {
    const wasNew = await awardBadgeIfNotAlready(patientId, code);
    if (wasNew) awarded.push(code);
  }
  return awarded;
}

// "Completeness" badge — the one that specifically rewards data QUALITY
// (all four categories logged the same day) rather than sheer count of
// entries, per the design note we agreed on.
async function loggedAllCategoriesToday(patientId) {
  const { start, end } = todayBounds();
  const [glucose, insulin, meal, activity] = await Promise.all([
    prisma.glucoseLog.count({ where: { patientId, loggedAt: { gte: start, lt: end } } }),
    prisma.insulinLog.count({ where: { patientId, loggedAt: { gte: start, lt: end } } }),
    prisma.mealLog.count({ where: { patientId, loggedAt: { gte: start, lt: end } } }),
    prisma.activityLog.count({ where: { patientId, loggedAt: { gte: start, lt: end } } }),
  ]);
  return glucose > 0 && insulin > 0 && meal > 0 && activity > 0;
}

async function awardBadgeIfNotAlready(patientId, code) {
  const badge = await prisma.badge.findUnique({ where: { code } });
  if (!badge) return false; // badge not seeded — fail silently rather than break a log request over it

  try {
    await prisma.patientBadge.create({ data: { patientId, badgeId: badge.id } });
    return true;
  } catch (err) {
    if (err.code === "P2002") return false; // unique constraint hit = already earned, expected
    throw err;
  }
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function sameDay(a, b) {
  return a.getTime() === b.getTime();
}
function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
function todayBounds() {
  const start = startOfDay(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}
