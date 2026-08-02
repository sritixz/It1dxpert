// Rule-based alert thresholds — deliberately plain if/else, not a model.
// This is what keeps the "Alerts" feature compliant with the no-AI-advisory
// decision: it flags out-of-range numbers using fixed clinical thresholds,
// it does not interpret, predict, or recommend anything.
//
// Thresholds are standard, widely-used ranges (ADA-aligned) and are now
// PER-DOCTOR CONFIGURABLE (Settings screen) — see DoctorProfile's threshold
// fields in the schema. These constants are the fallback defaults used
// whenever a doctor hasn't set their own.

export const DEFAULT_THRESHOLDS = {
  high: 180,
  low: 70,
  urgentHigh: 250,
  urgentLow: 54,
};

/**
 * Returns alert data if the glucose value is out of range, otherwise null.
 * `thresholds` is optional — pass a patient's assigned doctor's custom
 * values if they've set any; falls back to DEFAULT_THRESHOLDS otherwise.
 * Caller (log.service.js) decides whether to persist it as an Alert row.
 */
export function checkGlucoseAlert(value, thresholds = {}) {
  const { high, low, urgentHigh, urgentLow } = { ...DEFAULT_THRESHOLDS, ...thresholds };

  if (value >= urgentHigh) {
    return {
      type: "HIGH_GLUCOSE",
      severity: "CRITICAL",
      message: `Glucose reading of ${value} mg/dL is critically high.`,
    };
  }
  if (value > high) {
    return {
      type: "HIGH_GLUCOSE",
      severity: "WARNING",
      message: `Glucose reading of ${value} mg/dL is above target range.`,
    };
  }
  if (value <= urgentLow) {
    return {
      type: "LOW_GLUCOSE",
      severity: "CRITICAL",
      message: `Glucose reading of ${value} mg/dL is critically low.`,
    };
  }
  if (value < low) {
    return {
      type: "LOW_GLUCOSE",
      severity: "WARNING",
      message: `Glucose reading of ${value} mg/dL is below target range.`,
    };
  }
  return null;
}
