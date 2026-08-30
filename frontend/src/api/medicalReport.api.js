import { apiClient } from "./client.js";

/**
 * Fetch all medical reports uploaded by/for the patient.
 * @returns {Promise<Array>} List of medical reports
 */
export async function fetchMedicalReports() {
  const { data } = await apiClient.get("/patient/medical-reports");
  return data.data;
}

/**
 * Upload and create a medical report entry.
 * @param {object} params
 * @param {string} params.testName Test name
 * @param {string} params.value Value / result
 * @param {string} [params.dateTaken] ISO date string (optional)
 * @param {string} [params.notes] Notes (optional)
 * @param {File} [params.file] Document file binary (optional)
 */
export async function createMedicalReport({ testName, value, dateTaken, notes, file }) {
  const formData = new FormData();
  formData.append("testName", testName);
  formData.append("value", value);
  if (dateTaken) formData.append("dateTaken", dateTaken);
  if (notes) formData.append("notes", notes);
  if (file) formData.append("file", file);

  const { data } = await apiClient.post("/patient/medical-reports", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data.data;
}

/**
 * Delete a medical report entry.
 * @param {string} reportId
 */
export async function deleteMedicalReport(reportId) {
  await apiClient.delete(`/patient/medical-reports/${reportId}`);
}

/**
 * Fetch medical reports for a specific patient as a doctor.
 * @param {string} patientId Patient Profile ID
 * @returns {Promise<Array>} List of medical reports
 */
export async function fetchPatientMedicalReportsForDoctor(patientId) {
  const { data } = await apiClient.get(`/doctor/patients/${patientId}/medical-reports`);
  return data.data;
}

