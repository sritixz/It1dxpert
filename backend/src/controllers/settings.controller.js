import { z } from "zod";
import * as settingsService from "../services/settings.service.js";

const profileSchema = z.object({
  fullName: z.string().min(1),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  phone: z.string().optional(),
});

const clinicSchema = z.object({
  clinicName: z.string().optional(),
  clinicAddress: z.string().optional(),
  consultationType: z.string().optional(),
  timezone: z.string().optional(),
});

const notificationSchema = z.object({
  notifyHighGlucose: z.boolean(),
  notifyLowGlucose: z.boolean(),
  notifyMissedLogs: z.boolean(),
  notifyNewMessages: z.boolean(),
  notifyAppointments: z.boolean(),
});

// Thresholds are optional/nullable — a doctor can clear a field to fall
// back to the platform default rather than being forced to always set one.
const alertPreferencesSchema = z.object({
  highGlucoseThreshold: z.number().positive().nullable().optional(),
  lowGlucoseThreshold: z.number().positive().nullable().optional(),
  urgentHighThreshold: z.number().positive().nullable().optional(),
  urgentLowThreshold: z.number().positive().nullable().optional(),
  alertDeliveryInApp: z.boolean(),
  alertDeliveryEmail: z.boolean(),
  alertDeliverySms: z.boolean(),
  alertDeliveryWhatsApp: z.boolean(),
});

export async function getSettingsController(req, res) {
  const settings = await settingsService.getSettings(req.doctorProfileId);
  res.json({ success: true, data: settings });
}

export async function updateProfileController(req, res) {
  const data = profileSchema.parse(req.body);
  const profile = await settingsService.updateProfile(req.doctorProfileId, data);
  res.json({ success: true, data: profile });
}

export async function updateClinicController(req, res) {
  const data = clinicSchema.parse(req.body);
  const profile = await settingsService.updateClinicDetails(req.doctorProfileId, data);
  res.json({ success: true, data: profile });
}

export async function updateNotificationsController(req, res) {
  const data = notificationSchema.parse(req.body);
  const profile = await settingsService.updateNotificationPreferences(req.doctorProfileId, data);
  res.json({ success: true, data: profile });
}

export async function updateAlertPreferencesController(req, res) {
  const data = alertPreferencesSchema.parse(req.body);
  const profile = await settingsService.updateAlertPreferences(req.doctorProfileId, data);
  res.json({ success: true, data: profile });
}
