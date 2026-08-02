// Settings service — backs the Settings screen's four save-able panels.
// Deliberately four separate update functions (not one big "update
// everything") since the screen itself has four separate "Save" buttons —
// each panel saves independently, so the API should let it.

import { prisma } from "../config/db.js";

export async function getSettings(doctorProfileId) {
  return prisma.doctorProfile.findUnique({
    where: { id: doctorProfileId },
    include: { user: { select: { email: true, phone: true } } },
  });
}

export async function updateProfile(doctorProfileId, { fullName, specialization, licenseNumber, phone }) {
  const profile = await prisma.doctorProfile.update({
    where: { id: doctorProfileId },
    data: { fullName, specialization, licenseNumber },
  });

  if (phone) {
    await prisma.user.update({ where: { id: profile.userId }, data: { phone } });
  }

  return profile;
}

export async function updateClinicDetails(doctorProfileId, { clinicName, clinicAddress, consultationType, timezone }) {
  return prisma.doctorProfile.update({
    where: { id: doctorProfileId },
    data: { clinicName, clinicAddress, consultationType, timezone },
  });
}

export async function updateNotificationPreferences(doctorProfileId, prefs) {
  return prisma.doctorProfile.update({
    where: { id: doctorProfileId },
    data: {
      notifyHighGlucose: prefs.notifyHighGlucose,
      notifyLowGlucose: prefs.notifyLowGlucose,
      notifyMissedLogs: prefs.notifyMissedLogs,
      notifyNewMessages: prefs.notifyNewMessages,
      notifyAppointments: prefs.notifyAppointments,
    },
  });
}

/**
 * Alert threshold + delivery-channel preferences. NOTE on delivery: only
 * `alertDeliveryInApp` reflects something actually implemented — the
 * others (email/SMS/WhatsApp) are stored so the UI/schema are ready, but
 * there's no real sending infrastructure behind them yet (see schema
 * comment). Saving these preferences doesn't silently start sending real
 * emails/texts.
 */
export async function updateAlertPreferences(doctorProfileId, prefs) {
  return prisma.doctorProfile.update({
    where: { id: doctorProfileId },
    data: {
      highGlucoseThreshold: prefs.highGlucoseThreshold,
      lowGlucoseThreshold: prefs.lowGlucoseThreshold,
      urgentHighThreshold: prefs.urgentHighThreshold,
      urgentLowThreshold: prefs.urgentLowThreshold,
      alertDeliveryInApp: prefs.alertDeliveryInApp,
      alertDeliveryEmail: prefs.alertDeliveryEmail,
      alertDeliverySms: prefs.alertDeliverySms,
      alertDeliveryWhatsApp: prefs.alertDeliveryWhatsApp,
    },
  });
}
