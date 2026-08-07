import { apiClient } from "./client.js";

/**
 * Send a chat message to the CareAI chatbot assistant
 * @param {string} message The user's message
 * @param {Array<{role: string, content: string}>} history Conversation history
 * @returns {Promise<string>} The markdown response from CareAI
 */
export async function chatWithAiAgent(message, history = []) {
  const { data } = await apiClient.post("/patient/ai/chat", { message, history });
  return data.data.response;
}
