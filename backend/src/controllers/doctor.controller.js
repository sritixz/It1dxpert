import * as doctorService from "../services/doctor.service.js";

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

export async function listAlertsController(req, res) {
  const alerts = await doctorService.listAlerts({
    hospitalId: req.hospitalId,
    doctorProfileId: req.doctorProfileId,
  });
  res.json({ success: true, data: alerts });
}

export async function resolveAlertController(req, res) {
  const alert = await doctorService.resolveAlert(req.params.alertId, req.hospitalId);
  res.json({ success: true, data: alert });
}
