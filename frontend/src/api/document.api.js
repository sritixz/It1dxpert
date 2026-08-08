import { apiClient } from "./client.js";

// --- Patient Document Endpoints ---

/**
 * Fetch all documents uploaded by/for the patient
 * @returns {Promise<Array>} List of patient documents
 */
export async function fetchPatientDocuments() {
  const { data } = await apiClient.get("/patient/documents");
  return data.data;
}

/**
 * Upload a document (test report, prescription, etc.) as a patient
 * @param {object} params
 * @param {File} params.file The document file binary
 * @param {string} params.category "LAB_RESULT" | "PRESCRIPTION" | "OTHER"
 * @param {string} params.notes Additional description/notes
 * @param {string} params.appointmentId Linked appointment ID (optional)
 * @param {string} params.customName Custom name for the file (optional)
 */
export async function uploadPatientDocument({ file, category, notes, appointmentId, customName }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);
  if (notes) formData.append("notes", notes);
  if (appointmentId) formData.append("appointmentId", appointmentId);
  if (customName) formData.append("customName", customName);

  const { data } = await apiClient.post("/patient/documents", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data.data;
}

/**
 * Delete a patient document
 * @param {string} docId Document ID
 */
export async function deletePatientDocument(docId) {
  await apiClient.delete(`/patient/documents/${docId}`);
}

// --- Doctor Patient-Document Endpoints ---

/**
 * Fetch documents for a specific patient as a doctor
 * @param {string} patientId Patient Profile ID
 * @returns {Promise<Array>} Patient's documents list
 */
export async function fetchPatientDocumentsForDoctor(patientId) {
  const { data } = await apiClient.get(`/doctor/patients/${patientId}/documents`);
  return data.data;
}

/**
 * Upload a prescription file for a patient as a doctor
 * @param {string} patientId Patient Profile ID
 * @param {object} params
 * @param {File} params.file The prescription file
 * @param {string} params.notes Notes / instructions
 * @param {string} params.appointmentId Linked appointment ID (optional)
 * @param {string} params.customName Custom prescription name (optional)
 */
export async function uploadPrescriptionForPatient(patientId, { file, notes, appointmentId, customName }) {
  const formData = new FormData();
  formData.append("file", file);
  if (notes) formData.append("notes", notes);
  if (appointmentId) formData.append("appointmentId", appointmentId);
  if (customName) formData.append("customName", customName);

  const { data } = await apiClient.post(`/doctor/patients/${patientId}/documents`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data.data;
}

/**
 * Delete a patient document as a doctor
 * @param {string} patientId Patient Profile ID
 * @param {string} docId Document ID
 */
export async function deletePatientDocumentForDoctor(patientId, docId) {
  await apiClient.delete(`/doctor/patients/${patientId}/documents/${docId}`);
}
