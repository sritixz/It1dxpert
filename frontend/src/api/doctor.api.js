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