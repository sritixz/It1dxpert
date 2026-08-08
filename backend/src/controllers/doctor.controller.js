import * as doctorService from "../services/doctor.service.js";
import * as documentService from "../services/document.service.js";

// req.doctorProfileId is only set for DOCTOR role (see attachDoctorProfile
// middleware) — undefined for HOSPITAL_ADMIN. That's the entire mechanism
// behind "doctor sees only their patients, admin sees the whole hospital".

// Query params: ?status=IN_RANGE|HIGH|LOW|INACTIVE, ?page=1, ?pageSize=20
// Matches the Patients screen mockup's filter tabs + pagination.
export async function listPatientsController(req, res) {
  const { status, page, pageSize } = req.query;
  const result = await doctorService.listPatients({
    hospitalId: req.hospitalId,
    doctorProfileId: req.doctorProfileId,
    status: status || undefined,
    page: page ? Number(page) : 1,
    pageSize: pageSize ? Number(pageSize) : 20,
  });
  res.json({ success: true, data: result });
}

export async function getPatientOverviewController(req, res) {
  const data = await doctorService.getPatientOverview(req.params.patientId, {
    hospitalId: req.hospitalId,
    doctorProfileId: req.doctorProfileId,
  });
  res.json({ success: true, data });
}

// Glucose Monitor screen — GET /doctor/patients/:patientId/glucose-trends?days=7|14|30|90
export async function getPatientGlucoseTrendsController(req, res) {
  const days = Number(req.query.days) || 7;
  const data = await doctorService.getPatientGlucoseTrends(req.params.patientId, {
    hospitalId: req.hospitalId,
    doctorProfileId: req.doctorProfileId,
    days,
  });
  res.json({ success: true, data });
}

// Glucose Monitor's "Recent Events" panel — GET /doctor/patients/:patientId/timeline?limit=20
export async function getPatientTimelineController(req, res) {
  const limit = Number(req.query.limit) || 20;
  const data = await doctorService.getPatientTimeline(req.params.patientId, {
    hospitalId: req.hospitalId,
    doctorProfileId: req.doctorProfileId,
    limit,
  });
  res.json({ success: true, data });
}

// Alerts screen — GET /doctor/alerts?type=HIGH_GLUCOSE|LOW_GLUCOSE|MISSED_LOG
export async function listAlertsController(req, res) {
  const result = await doctorService.listAlerts({
    hospitalId: req.hospitalId,
    doctorProfileId: req.doctorProfileId,
    type: req.query.type || undefined,
  });
  res.json({ success: true, data: result });
}

export async function markAlertReadController(req, res) {
  const alert = await doctorService.markAlertRead(req.params.alertId, req.hospitalId);
  res.json({ success: true, data: alert });
}

export async function resolveAlertController(req, res) {
  const alert = await doctorService.resolveAlert(req.params.alertId, req.hospitalId);
  res.json({ success: true, data: alert });
}

export async function getPatientAppointmentRecordsController(req, res) {
  const result = await doctorService.getPatientAppointmentRecords(req.params.patientId, {
    hospitalId: req.hospitalId,
    doctorProfileId: req.doctorProfileId,
  });
  res.json({ success: true, data: result });
}

export async function listPatientDocumentsController(req, res) {
  const { patientId } = req.params;
  const docs = await documentService.getPatientDocumentsForDoctor(patientId, req.hospitalId);
  res.json({ success: true, data: docs });
}

export async function doctorUploadPrescriptionController(req, res) {
  const { patientId } = req.params;
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file was uploaded." });
  }

  const { notes, appointmentId, customName } = req.body;
  const fileName = customName || req.file.originalname;
  const fileUrl = `/uploads/${req.file.filename}`;

  const doc = await documentService.createDocument({
    patientId,
    hospitalId: req.hospitalId,
    appointmentId: appointmentId || null,
    fileName,
    fileType: req.file.mimetype,
    fileUrl,
    category: "PRESCRIPTION",
    uploadedBy: "DOCTOR",
    notes: notes || null,
  });

  res.status(201).json({ success: true, data: doc });
}

export async function doctorDeleteDocumentController(req, res) {
  const { docId } = req.params;
  await documentService.deleteDoctorDocument(docId, req.hospitalId);
  res.json({ success: true, message: "Document deleted successfully." });
}
