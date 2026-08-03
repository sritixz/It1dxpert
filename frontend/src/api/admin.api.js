// Admin-side API calls. Matches it1dxpert-backend's /api/admin/* routes.
// Works for both HOSPITAL_ADMIN and SUPER_ADMIN — the backend scopes
// results automatically based on the caller's role/hospital, so the
// frontend doesn't need separate functions per role.

import { apiClient } from "./client.js";

// --- Dashboard ---
export async function fetchDashboardStats() {
  const { data } = await apiClient.get("/admin/dashboard");
  return data.data;
}

export async function fetchRegistrationTrend(days = 7) {
  const { data } = await apiClient.get("/admin/dashboard/registration-trend", { params: { days } });
  return data.data;
}

// --- Hospitals / Clinics ---
export async function fetchHospitals() {
  const { data } = await apiClient.get("/admin/hospitals");
  return data.data;
}

export async function fetchHospitalDetail(hospitalId) {
  const { data } = await apiClient.get(`/admin/hospitals/${hospitalId}`);
  return data.data;
}

export async function createHospital(payload) {
  const { data } = await apiClient.post("/admin/hospitals", payload);
  return data.data;
}

export async function updateHospital(hospitalId, payload) {
  const { data } = await apiClient.patch(`/admin/hospitals/${hospitalId}`, payload);
  return data.data;
}

// --- Users & Roles ---
export async function fetchUsers({ role, status, search, page = 1, pageSize = 20 } = {}) {
  const { data } = await apiClient.get("/admin/users", { params: { role, status, search, page, pageSize } });
  return data.data;
}

export async function setUserActive(userId, isActive) {
  const { data } = await apiClient.patch(`/admin/users/${userId}/active`, { isActive });
  return data.data;
}

// --- Support Tickets (admin view) ---
export async function fetchTickets({ status } = {}) {
  const { data } = await apiClient.get("/admin/support-tickets", { params: { status } });
  return data.data;
}

export async function fetchTicketStats() {
  const { data } = await apiClient.get("/admin/support-tickets/stats");
  return data.data;
}

export async function updateTicketStatus(ticketId, status) {
  const { data } = await apiClient.patch(`/admin/support-tickets/${ticketId}/status`, { status });
  return data.data;
}
