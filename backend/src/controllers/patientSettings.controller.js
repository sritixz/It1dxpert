import { z } from "zod";
import * as settingsService from "../services/patientSettings.service.js";
import * as authService from "../services/auth.service.js";

const profileSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().optional(),
});

const emergencyContactSchema = z.object({
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
});

const preferencesSchema = z.object({
  preferredUnits: z.enum(["mg/dL", "mmol/L"]),
  timezone: z.string(),
  language: z.string(),
  theme: z.enum(["light", "dark"]),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function getSettingsController(req, res) {
  const settings = await settingsService.getSettings(req.patientProfileId);
  res.json({ success: true, data: settings });
}

export async function updateProfileController(req, res) {
  const data = profileSchema.parse(req.body);
  const profile = await settingsService.updateProfile(req.patientProfileId, data);
  res.json({ success: true, data: profile });
}

export async function updateEmergencyContactController(req, res) {
  const data = emergencyContactSchema.parse(req.body);
  const profile = await settingsService.updateEmergencyContact(req.patientProfileId, data);
  res.json({ success: true, data: profile });
}

export async function updatePreferencesController(req, res) {
  const data = preferencesSchema.parse(req.body);
  const profile = await settingsService.updatePreferences(req.patientProfileId, data);
  res.json({ success: true, data: profile });
}

export async function exportDataController(req, res) {
  const csv = await settingsService.exportDataAsCsv(req.patientProfileId);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=diabetescare-export.csv");
  res.send(csv);
}

// Password change lives at the auth layer (see auth.service.js) since it's
// not patient-specific — this is a thin pass-through, kept here so the
// frontend can call one consistent /patient/settings/* path alongside the
// rest of the Settings screen's endpoints.
export async function changePasswordController(req, res) {
  const data = changePasswordSchema.parse(req.body);
  await authService.changePassword(req.auth.userId, data);
  res.json({ success: true, data: null });
}
