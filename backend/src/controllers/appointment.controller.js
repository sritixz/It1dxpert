import { z } from "zod";
import * as appointmentService from "../services/appointment.service.js";

const createSchema = z.object({
  patientId: z.string().uuid(),
  scheduledAt: z.string(),
  type: z.enum(["Follow-up", "Consultation"]).default("Follow-up"),
  purpose: z.string().optional(),
  mode: z.enum(["VIDEO_CALL", "IN_CLINIC"]).default("IN_CLINIC"),
  notes: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]),
});

// A HOSPITAL_ADMIN has no doctorProfileId (see attachDoctorProfile), so
// creating an appointment as an admin requires specifying which doctor —
// while a DOCTOR always creates it under their own id, ignoring any
// doctorId the client might send, same "never trust the body for your own
// identity" pattern used throughout the RBAC chain.
export async function createAppointmentController(req, res) {
  const data = createSchema.parse(req.body);
  const doctorId = req.doctorProfileId || req.body.doctorId;
  const appointment = await appointmentService.createAppointment({
    hospitalId: req.hospitalId,
    doctorId,
    ...data,
  });
  res.status(201).json({ success: true, data: appointment });
}

// GET /doctor/appointments?status=PENDING&when=today|upcoming
export async function listAppointmentsController(req, res) {
  const appointments = await appointmentService.listAppointments({
    hospitalId: req.hospitalId,
    doctorProfileId: req.doctorProfileId,
    status: req.query.status || undefined,
    when: req.query.when || undefined,
  });
  res.json({ success: true, data: appointments });
}

export async function getAppointmentStatsController(req, res) {
  const stats = await appointmentService.getAppointmentStats({
    hospitalId: req.hospitalId,
    doctorProfileId: req.doctorProfileId,
  });
  res.json({ success: true, data: stats });
}

// GET /doctor/appointments/calendar?year=2025&month=5
export async function getCalendarSummaryController(req, res) {
  const year = Number(req.query.year) || new Date().getFullYear();
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const summary = await appointmentService.getCalendarSummary({
    hospitalId: req.hospitalId,
    doctorProfileId: req.doctorProfileId,
    year,
    month,
  });
  res.json({ success: true, data: summary });
}

export async function updateAppointmentStatusController(req, res) {
  const { status } = statusSchema.parse(req.body);
  const appointment = await appointmentService.updateAppointmentStatus(req.params.appointmentId, req.hospitalId, status);
  res.json({ success: true, data: appointment });
}
