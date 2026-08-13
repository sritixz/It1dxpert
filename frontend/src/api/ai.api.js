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

/**
 * Analyze a meal description text using CareAI
 * @param {string} foodText Description of the meal
 * @returns {Promise<object>} The nutrition analysis
 */
export async function analyzeMealText(foodText) {
  const { data } = await apiClient.post("/patient/ai/analyze-meal", { foodText });
  return data.data;
}

/**
 * Analyze a meal photo using CareAI
 * @param {File} imageFile The uploaded image file
 * @returns {Promise<object>} The nutrition analysis
 */
export async function analyzeMealImage(imageFile) {
  const formData = new FormData();
  formData.append("mealImage", imageFile);

  const { data } = await apiClient.post("/patient/ai/analyze-meal", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data.data;
}

/**
 * Extract diabetes logs from a handwritten log diary or device screen photo
 * @param {File} docFile Image file
 * @returns {Promise<object>} JSON array of identified logs
 */
export async function extractLogsFromDocument(docFile) {
  const formData = new FormData();
  formData.append("docFile", docFile);

  const { data } = await apiClient.post("/patient/ai/extract-logs", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data.data; // returns { extractedLogs: [...] }
}


