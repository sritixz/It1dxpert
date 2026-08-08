import { prisma } from "../config/db.js";

/**
 * Analyze blood glucose trends over the last 7 days and recommend insulin dose adjustments.
 * @param {string} patientId Patient Profile ID
 * @returns {Promise<object>} Recommendation and trend chart dataset
 */
export async function getInsulinAdvice(patientId) {
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: { assignedDoctor: true },
  });

  if (!patient) {
    throw new Error("Patient profile not found.");
  }

  // Fetch last 7 days of logs
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [glucoseLogs, insulinLogs] = await Promise.all([
    prisma.glucoseLog.findMany({
      where: { patientId, loggedAt: { gte: sevenDaysAgo } },
      orderBy: { loggedAt: "asc" },
    }),
    prisma.insulinLog.findMany({
      where: { patientId, loggedAt: { gte: sevenDaysAgo } },
      orderBy: { loggedAt: "asc" },
    }),
  ]);

  // Group readings by date (local timezone) for the trend chart
  const dailyDataMap = {};
  
  // Initialize the last 7 days in the map so the chart has placeholders even for empty days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    dailyDataMap[dateStr] = {
      date: dateStr,
      avgGlucose: 0,
      glucoseCount: 0,
      rapidInsulin: 0,
      longInsulin: 0,
    };
  }

  // Populate glucose logs in daily totals
  glucoseLogs.forEach((log) => {
    const dateStr = new Date(log.loggedAt).toISOString().slice(0, 10);
    if (dailyDataMap[dateStr]) {
      dailyDataMap[dateStr].avgGlucose += log.value;
      dailyDataMap[dateStr].glucoseCount += 1;
    }
  });

  // Populate insulin logs in daily totals
  insulinLogs.forEach((log) => {
    const dateStr = new Date(log.loggedAt).toISOString().slice(0, 10);
    if (dailyDataMap[dateStr]) {
      const type = (log.insulinType || "").toLowerCase();
      const units = log.units;
      if (type.includes("rapid") || type.includes("meal") || type.includes("lispro") || type.includes("aspart")) {
        dailyDataMap[dateStr].rapidInsulin += units;
      } else {
        // Assume long acting / basal otherwise
        dailyDataMap[dateStr].longInsulin += units;
      }
    }
  });

  // Compile series and calculate averages
  const dailySeries = Object.values(dailyDataMap).map((day) => {
    const avg = day.glucoseCount > 0 ? Math.round(day.avgGlucose / day.glucoseCount) : null;
    return {
      date: day.date,
      averageGlucose: avg,
      rapidInsulin: Number(day.rapidInsulin.toFixed(1)),
      longInsulin: Number(day.longInsulin.toFixed(1)),
      totalInsulin: Number((day.rapidInsulin + day.longInsulin).toFixed(1)),
    };
  });

  // Filter logs for clinical trend calculation
  const totalGlucoseCount = glucoseLogs.length;

  // Need at least 3 glucose logs to compute safe trends
  if (totalGlucoseCount < 3) {
    return {
      status: "INSUFFICIENT_DATA",
      trend: "STABLE",
      averageGlucose: totalGlucoseCount > 0 ? Math.round(glucoseLogs.reduce((s, l) => s + l.value, 0) / totalGlucoseCount) : null,
      message: "Insufficient glucose readings.",
      recommendation: "Please log at least 3 blood glucose readings over the past few days so CareAI can establish a reliable blood sugar trend and recommend adjustments.",
      dailySeries,
    };
  }

  const allGlucoseValues = glucoseLogs.map(l => l.value);
  const avgGlucose = Math.round(allGlucoseValues.reduce((s, v) => s + v, 0) / totalGlucoseCount);

  // Focus on last 3 days of glucose logs to establish current active trend
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const recentGlucose = glucoseLogs.filter(l => new Date(l.loggedAt) >= threeDaysAgo);
  const recentValues = recentGlucose.map(l => l.value);
  const recentAvg = recentValues.length > 0 
    ? Math.round(recentValues.reduce((s, v) => s + v, 0) / recentValues.length)
    : avgGlucose;

  // Extract fasting/pre-meal readings (context contains "fasting" or "pre-meal", or logged early morning 6-9 AM)
  const fastingLogs = recentGlucose.filter((log) => {
    const context = (log.context || "").toLowerCase();
    if (context.includes("fast") || context.includes("pre-meal") || context.includes("pre")) return true;
    
    // Fallback: Check time logged (6:00 to 9:30 AM local time based on timezone offset)
    const logHour = new Date(log.loggedAt).getHours();
    return logHour >= 6 && logHour <= 9;
  });

  const fastingAvg = fastingLogs.length > 0
    ? Math.round(fastingLogs.reduce((s, l) => s + l.value, 0) / fastingLogs.length)
    : null;

  // Check for Hypoglycemia Risk (any reading below 70 mg/dL, or average below 85)
  const hasLows = allGlucoseValues.some(v => v < 70);
  const averageIsLow = recentAvg < 80;

  let status = "STABLE";
  let trend = "STABLE";
  let message = "Your blood glucose levels look stable.";
  let recommendation = "Your logs indicate excellent glycemic control. Keep maintaining your current insulin doses, carbohydrate ratios, and activity routines. Don't forget to log your daily readings!";

  if (hasLows || averageIsLow) {
    status = "LOW_TREND";
    trend = "LOW";
    message = "Hypoglycemia risk or low glucose trends detected.";
    recommendation = `We observed low readings (below 70 mg/dL) or an average glucose of ${recentAvg} mg/dL over the past 3 days. To prevent dangerous nocturnal or daytime hypoglycemia:
1. Consider reducing your long-acting (basal) insulin by 10% to 20% (approx. 1 to 2 units).
2. Review your rapid-acting insulin-to-carb ratios, especially if lows happen after meals.
3. Always carry fast-acting carbohydrates (like juice or glucose tablets).`;
  } 
  // Check for high fasting readings (dawn phenomenon or insufficient basal)
  else if (fastingAvg && fastingAvg > 130) {
    status = "HIGH_TREND";
    trend = "HIGH";
    message = `Elevated morning fasting glucose detected (Average: ${fastingAvg} mg/dL).`;
    recommendation = `Your fasting blood glucose has averaged ${fastingAvg} mg/dL over the last 3 days, which is above the target range (80-130 mg/dL).
1. Consider increasing your long-acting (basal) insulin dose by 10% (typically 1 to 2 units).
2. Check your blood sugar at 3:00 AM tonight to rule out rebound hyperglycemia (Somogyi effect).
3. Discuss this fasting trend with Dr. ${patient.assignedDoctor?.fullName || "your physician"} at your next appointment.`;
  }
  // Check for general high average glucose (high post-meals or insufficient bolus/carb coverage)
  else if (recentAvg > 165) {
    status = "HIGH_TREND";
    trend = "HIGH";
    message = `Elevated general glucose trends detected (Average: ${recentAvg} mg/dL).`;
    recommendation = `Your overall average glucose over the past 3 days is ${recentAvg} mg/dL, which is running high.
1. You may need to slightly increase your meal-time rapid-acting insulin (bolus) or adjust your insulin-to-carbohydrate ratios (e.g. taking more units per 10g of carbs).
2. Be sure to log your meals and pre/post-meal glucose readings to isolate which meal is causing the rise.
3. Consult with Dr. ${patient.assignedDoctor?.fullName || "your physician"} to review your correction factors.`;
  }

  // Append clinical disclaimer
  const doctorName = patient.assignedDoctor?.fullName ? `Dr. ${patient.assignedDoctor.fullName}` : "your endocrinologist";
  const disclaimer = `Disclaimer: This feedback is rule-based and for educational tracking purposes only. Please verify these suggestions and coordinate any insulin regimen adjustments with ${doctorName} before making clinical changes.`;

  return {
    status,
    trend,
    averageGlucose: avgGlucose,
    message,
    recommendation,
    disclaimer,
    dailySeries,
  };
}
