import { apiClient } from "./client.js";

export async function submitSupportTicket({ subject, message }) {
  const { data } = await apiClient.post("/support/tickets", { subject, message });
  return data.data;
}
