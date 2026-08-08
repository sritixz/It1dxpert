import { apiClient } from "./client.js";

/**
 * Fetch blood glucose trend analysis and insulin dose recommendations
 * @returns {Promise<object>} The advisor payload containing status, recommendation, and dailySeries
 */
export async function fetchInsulinAdjustmentAdvice() {
  const { data } = await apiClient.get("/patient/insulin-advisor");
  return data.data;
}
