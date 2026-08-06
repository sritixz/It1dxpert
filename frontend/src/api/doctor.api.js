// Doctor-side API calls. Matches the backend's /api/doctor/* routes 1:1 —
// see it1dxpert-backend/src/routes/doctor.routes.js for the source of truth.

import { apiClient } from "./client.js";

// Patients list — status is one of IN_RANGE | HIGH | LOW | INACTIVE, or
// undefined for "All". Response shape: { patients, counts, page, pageSize, total }
export async function fetchPatients({ status, page = 1, pageSize = 20 } = {}) {
  const { data } = await apiClient.get("/doctor/patients", {
    params: { status, page, pageSize },
  });
  return data.data;
}

export async function fetchPatientOverview(patientId) {
  const { data } = await apiClient.get(`/doctor/patients/${patientId}`);
  return data.data;
}

// Glucose Monitor screen — days is one of 7 | 14 | 30 | 90 (backend doesn't
// support intraday granularity like 3H/6H/12H/24H yet — those tabs from the
// reference mockup aren't backed by real data, so they're not offered here).
export async function fetchPatientGlucoseTrends(patientId, days = 7) {
  const { data } = await apiClient.get(`/doctor/patients/${patientId}/glucose-trends`, {
    params: { days },
  });
  return data.data;
}

export async function fetchPatientTimeline(patientId, limit = 20) {
  const { data } = await apiClient.get(`/doctor/patients/${patientId}/timeline`, {
    params: { limit },
  });
  return data.data;
}

export async function fetchPatientAppointmentRecords(patientId) {
  const { data } = await apiClient.get(`/doctor/patients/${patientId}/appointment-records`);
  return data.data;
}

// --- Alerts ---
// type is one of HIGH_GLUCOSE | LOW_GLUCOSE | MISSED_LOG, or undefined for "All".
// Response shape: { alerts, summary: { total, highGlucose, lowGlucose, missedLogs } }
export async function fetchAlerts({ type } = {}) {
  const { data } = await apiClient.get("/doctor/alerts", { params: { type } });
  return data.data;
}

export async function markAlertRead(alertId) {
  const { data } = await apiClient.patch(`/doctor/alerts/${alertId}/read`);
  return data.data;
}

export async function resolveAlert(alertId) {
  const { data } = await apiClient.patch(`/doctor/alerts/${alertId}/resolve`);
  return data.data;
}

// --- Appointments ---
export async function fetchAppointments({ status, when } = {}) {
  const { data } = await apiClient.get("/doctor/appointments", { params: { status, when } });
  return data.data;
}

export async function fetchAppointmentStats() {
  const { data } = await apiClient.get("/doctor/appointments/stats");
  return data.data;
}

export async function fetchCalendarSummary(year, month) {
  const { data } = await apiClient.get("/doctor/appointments/calendar", { params: { year, month } });
  return data.data;
}

export async function createAppointment(payload) {
  const { data } = await apiClient.post("/doctor/appointments", payload);
  return data.data;
}

export async function updateAppointmentStatus(appointmentId, status) {
  const { data } = await apiClient.patch(`/doctor/appointments/${appointmentId}/status`, { status });
  return data.data;
}

export async function fetchAppointmentRecord(appointmentId) {
  const { data } = await apiClient.get(`/doctor/appointments/${appointmentId}/record`);
  return data.data;
}

export async function saveAppointmentRecord(appointmentId, payload) {
  const { data } = await apiClient.post(`/doctor/appointments/${appointmentId}/record`, payload);
  return data.data;
}

// --- Settings ---
export async function fetchSettings() {
  const { data } = await apiClient.get("/doctor/settings");
  return data.data;
}

export async function updateProfileSettings(payload) {
  const { data } = await apiClient.patch("/doctor/settings/profile", payload);
  return data.data;
}

export async function updateClinicSettings(payload) {
  const { data } = await apiClient.patch("/doctor/settings/clinic", payload);
  return data.data;
}

export async function updateNotificationSettings(payload) {
  const { data } = await apiClient.patch("/doctor/settings/notifications", payload);
  return data.data;
}

export async function updateAlertPreferences(payload) {
  const { data } = await apiClient.patch("/doctor/settings/alert-preferences", payload);
  return data.data;
}
