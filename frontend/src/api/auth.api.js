// Thin wrappers around the auth endpoints — keeps components from knowing
// exact URLs/response shapes; matches the backend's /api/auth/* routes 1:1.

import { apiClient } from "./client.js";

export async function loginRequest({ email, password }) {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data.data; // { accessToken, refreshToken, user }
}

export async function registerPatientRequest(payload) {
  const { data } = await apiClient.post("/auth/register/patient", payload);
  return data.data;
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get("/auth/me");
  return data.data;
}
