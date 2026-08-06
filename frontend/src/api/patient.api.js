// Patient-side API calls for this round's four screens. Matches
// it1dxpert-backend's /api/patient/* routes 1:1.

import { apiClient } from "./client.js";

// --- Insulin Records ---
export async function fetchInsulinSummary(days = 7) {
  const { data } = await apiClient.get("/patient/insulin-records", { params: { days } });
  return data.data;
}

export async function logInsulin(payload) {
  const { data } = await apiClient.post("/patient/logs/insulin", payload);
  return data.data;
}

export async function updateInsulinLog(logId, payload) {
  const { data } = await apiClient.patch(`/patient/logs/insulin/${logId}`, payload);
  return data.data;
}

export async function deleteInsulinLog(logId) {
  await apiClient.delete(`/patient/logs/insulin/${logId}`);
}

// --- Activity ---
export async function fetchActivitySummary() {
  const { data } = await apiClient.get("/patient/activity-summary");
  return data.data;
}

export async function logActivity(payload) {
  const { data } = await apiClient.post("/patient/logs/activity", payload);
  return data.data;
}

export async function updateActivityLog(logId, payload) {
  const { data } = await apiClient.patch(`/patient/logs/activity/${logId}`, payload);
  return data.data;
}

export async function deleteActivityLog(logId) {
  await apiClient.delete(`/patient/logs/activity/${logId}`);
}

// --- Appointments ---
export async function fetchMyAppointments({ status, when } = {}) {
  const { data } = await apiClient.get("/patient/appointments", { params: { status, when } });
  return data.data;
}

export async function fetchMyAppointmentStats() {
  const { data } = await apiClient.get("/patient/appointments/stats");
  return data.data;
}

export async function fetchMyCalendarSummary(year, month) {
  const { data } = await apiClient.get("/patient/appointments/calendar", { params: { year, month } });
  return data.data;
}

export async function requestAppointment(payload) {
  const { data } = await apiClient.post("/patient/appointments", payload);
  return data.data;
}

export async function fetchMyAppointmentRecord(appointmentId) {
  const { data } = await apiClient.get(`/patient/appointments/${appointmentId}/record`);
  return data.data;
}

// --- Daily Log ---
export async function fetchDailyLog(date) {
  const { data } = await apiClient.get("/patient/daily-log", { params: { date } });
  return data.data;
}

export async function logGlucose(payload) {
  const { data } = await apiClient.post("/patient/logs/glucose", payload);
  return data.data;
}

export async function logMeal(payload) {
  const { data } = await apiClient.post("/patient/logs/meal", payload);
  return data.data;
}

// --- Settings ---
export async function fetchPatientSettings() {
  const { data } = await apiClient.get("/patient/settings");
  return data.data;
}

export async function updatePatientProfile(payload) {
  const { data } = await apiClient.patch("/patient/settings/profile", payload);
  return data.data;
}

export async function updateEmergencyContact(payload) {
  const { data } = await apiClient.patch("/patient/settings/emergency-contact", payload);
  return data.data;
}

export async function updatePatientPreferences(payload) {
  const { data } = await apiClient.patch("/patient/settings/preferences", payload);
  return data.data;
}

export async function changePassword(payload) {
  const { data } = await apiClient.post("/patient/settings/change-password", payload);
  return data.data;
}

// --- Gamification ---
export async function fetchGamificationStatus() {
  const { data } = await apiClient.get("/patient/gamification");
  return data.data;
}

// CSV export — returns a Blob rather than JSON, so the caller can trigger
// a browser download directly.
export async function exportPatientData() {
  const response = await apiClient.get("/patient/settings/export", { responseType: "blob" });
  return response.data;
}

