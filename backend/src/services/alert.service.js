// Rule-based alert thresholds — deliberately plain if/else, not a model.
// This is what keeps the "Alerts" feature compliant with the no-AI-advisory
// decision: it flags out-of-range numbers using fixed clinical thresholds,
// it does not interpret, predict, or recommend anything.
//
// Thresholds are standard, widely-used ranges (ADA-aligned), not something
// derived from patient data — same numbers apply to every patient. If
// PGI wants per-patient custom thresholds later, that's a small change
// here (read from patient profile instead of a constant), not a redesign.

const HIGH_THRESHOLD = 180;
const LOW_THRESHOLD = 70;
const CRITICAL_HIGH = 250;
const CRITICAL_LOW = 54;

/**
 * Returns alert data if the glucose value is out of range, otherwise null.
 * Caller (log.service.js) decides whether to persist it as an Alert row.
 */
export function checkGlucoseAlert(value) {
  if (value >= CRITICAL_HIGH) {
    return {
      type: "HIGH_GLUCOSE",
      severity: "CRITICAL",
      message: `Glucose reading of ${value} mg/dL is critically high.`,
    };
  }
  if (value > HIGH_THRESHOLD) {
    return {
      type: "HIGH_GLUCOSE",
      severity: "WARNING",
      message: `Glucose reading of ${value} mg/dL is above target range.`,
    };
  }
  if (value <= CRITICAL_LOW) {
    return {
      type: "LOW_GLUCOSE",
      severity: "CRITICAL",
      message: `Glucose reading of ${value} mg/dL is critically low.`,
    };
  }
  if (value < LOW_THRESHOLD) {
    return {
      type: "LOW_GLUCOSE",
      severity: "WARNING",
      message: `Glucose reading of ${value} mg/dL is below target range.`,
    };
  }
  return null;
}
