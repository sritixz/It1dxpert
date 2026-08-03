import { z } from "zod";
import * as appointmentService from "../services/appointment.service.js";

const createSchema = z
  .object({
    doctorId: z.string().uuid().optional(),
    providerName: z.string().optional(),
    providerType: z.string().optional(),
    scheduledAt: z.string(),
    type: z.string().default("Follow-up"),
    purpose: z.string().optional(),
    mode: z.enum(["VIDEO_CALL", "IN_CLINIC"]).default("IN_CLINIC"),
    location: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.doctorId || data.providerName, {
    message: "Either doctorId (an on-platform doctor) or providerName (external provider) is required",
  });

// Patient-initiated appointment request. Always lands as PENDING (see
// appointment.service.js's createAppointment default) — a patient
// requesting a slot doesn't auto-confirm it; a doctor/admin still
// confirms or reschedules from their own Appointments screen.
export async function createAppointmentController(req, res) {
  const data = createSchema.parse(req.body);
  const appointment = await appointmentService.createAppointment({
    hospitalId: req.hospitalId,
    patientId: req.patientProfileId,
    ...data,
  });
  res.status(201).json({ success: true, data: appointment });
}

// GET /patient/appointments?status=PENDING&when=upcoming
export async function listAppointmentsController(req, res) {
  const appointments = await appointmentService.listAppointments({
    hospitalId: req.hospitalId,
    patientProfileId: req.patientProfileId,
    status: req.query.status || undefined,
    when: req.query.when || undefined,
  });
  res.json({ success: true, data: appointments });
}

export async function getAppointmentStatsController(req, res) {
  const stats = await appointmentService.getPatientAppointmentStats(req.patientProfileId);
  res.json({ success: true, data: stats });
}

export async function getCalendarSummaryController(req, res) {
  const year = Number(req.query.year) || new Date().getFullYear();
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const summary = await appointmentService.getCalendarSummary({
    hospitalId: req.hospitalId,
    patientProfileId: req.patientProfileId,
    year,
    month,
  });
  res.json({ success: true, data: summary });
}
