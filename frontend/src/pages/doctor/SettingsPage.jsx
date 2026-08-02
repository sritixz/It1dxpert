// Settings screen — four independent panels, matching the four separate
// backend endpoints (profile/clinic/notifications/alert-preferences). Each
// panel has its own Save button and its own saving/saved state, since
// they're genuinely independent operations, not one big form.

import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Toggle } from "../../components/ui/Toggle.jsx";
import {
  fetchSettings, updateProfileSettings, updateClinicSettings,
  updateNotificationSettings, updateAlertPreferences,
} from "../../api/doctor.api.js";

export function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings().then(setSettings).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <p className="font-body text-sm text-muted">Loading settings…</p>;
  if (!settings) return <p className="font-body text-sm text-critical">Couldn't load settings.</p>;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ProfilePanel settings={settings} onSaved={setSettings} />
      <ClinicPanel settings={settings} onSaved={setSettings} />
      <NotificationsPanel settings={settings} onSaved={setSettings} />
      <AlertPreferencesPanel settings={settings} onSaved={setSettings} />
    </div>
  );
}

function SaveButton({ onClick, isSaving, saved }) {
  return (
    <Button onClick={onClick} isLoading={isSaving} className="mt-2">
      {saved ? "Saved ✓" : "Save Changes"}
    </Button>
  );
}

function ProfilePanel({ settings, onSaved }) {
  const [form, setForm] = useState({
    fullName: settings.fullName || "",
    specialization: settings.specialization || "",
    licenseNumber: settings.licenseNumber || "",
    phone: settings.user?.phone || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    try {
      const updated = await updateProfileSettings(form);
      onSaved((prev) => ({ ...prev, ...updated }));
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <p className="mb-4 font-display text-sm font-bold text-ink">Profile Settings</p>
      <div className="flex flex-col gap-3">
        <Input label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <Input label="Specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
        <Input label="License Number" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
        <Input label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Email" value={settings.user?.email || ""} disabled className="opacity-60" />
        <SaveButton onClick={handleSave} isSaving={isSaving} saved={saved} />
      </div>
    </Card>
  );
}

function ClinicPanel({ settings, onSaved }) {
  const [form, setForm] = useState({
    clinicName: settings.clinicName || "",
    clinicAddress: settings.clinicAddress || "",
    consultationType: settings.consultationType || "Both Online & In-Clinic",
    timezone: settings.timezone || "Asia/Kolkata",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    try {
      const updated = await updateClinicSettings(form);
      onSaved((prev) => ({ ...prev, ...updated }));
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <p className="mb-4 font-display text-sm font-bold text-ink">Clinic / Practice Details</p>
      <div className="flex flex-col gap-3">
        <Input label="Clinic / Hospital Name" value={form.clinicName} onChange={(e) => setForm({ ...form, clinicName: e.target.value })} />
        <Input label="Address" value={form.clinicAddress} onChange={(e) => setForm({ ...form, clinicAddress: e.target.value })} />
        <Input label="Consultation Type" value={form.consultationType} onChange={(e) => setForm({ ...form, consultationType: e.target.value })} />
        <Input label="Time Zone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
        <SaveButton onClick={handleSave} isSaving={isSaving} saved={saved} />
      </div>
    </Card>
  );
}

function NotificationsPanel({ settings, onSaved }) {
  const [form, setForm] = useState({
    notifyHighGlucose: settings.notifyHighGlucose,
    notifyLowGlucose: settings.notifyLowGlucose,
    notifyMissedLogs: settings.notifyMissedLogs,
    notifyNewMessages: settings.notifyNewMessages,
    notifyAppointments: settings.notifyAppointments,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    try {
      const updated = await updateNotificationSettings(form);
      onSaved((prev) => ({ ...prev, ...updated }));
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <p className="mb-2 font-display text-sm font-bold text-ink">Notification Preferences</p>
      <div className="divide-y divide-border">
        <Toggle label="High Glucose Alerts" description="Notify when patient glucose is above set range" checked={form.notifyHighGlucose} onChange={(v) => setForm({ ...form, notifyHighGlucose: v })} />
        <Toggle label="Low Glucose Alerts" description="Notify when patient glucose is below set range" checked={form.notifyLowGlucose} onChange={(v) => setForm({ ...form, notifyLowGlucose: v })} />
        <Toggle label="Missed Logs" description="Notify when a patient misses logging data" checked={form.notifyMissedLogs} onChange={(v) => setForm({ ...form, notifyMissedLogs: v })} />
        <Toggle label="New Messages" description="Notify for new messages from patients" checked={form.notifyNewMessages} onChange={(v) => setForm({ ...form, notifyNewMessages: v })} />
        <Toggle label="Appointment Reminders" description="Receive reminders for upcoming appointments" checked={form.notifyAppointments} onChange={(v) => setForm({ ...form, notifyAppointments: v })} />
      </div>
      <SaveButton onClick={handleSave} isSaving={isSaving} saved={saved} />
    </Card>
  );
}

function AlertPreferencesPanel({ settings, onSaved }) {
  const [form, setForm] = useState({
    highGlucoseThreshold: settings.highGlucoseThreshold ?? 180,
    lowGlucoseThreshold: settings.lowGlucoseThreshold ?? 70,
    urgentHighThreshold: settings.urgentHighThreshold ?? 250,
    urgentLowThreshold: settings.urgentLowThreshold ?? 54,
    alertDeliveryInApp: settings.alertDeliveryInApp,
    alertDeliveryEmail: settings.alertDeliveryEmail,
    alertDeliverySms: settings.alertDeliverySms,
    alertDeliveryWhatsApp: settings.alertDeliveryWhatsApp,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    try {
      const updated = await updateAlertPreferences(form);
      onSaved((prev) => ({ ...prev, ...updated }));
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <p className="mb-1 font-display text-sm font-bold text-ink">Alert Preferences</p>
      <p className="mb-4 font-body text-xs text-muted">
        These override the platform defaults for your patients only.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="High Glucose Threshold" type="number" value={form.highGlucoseThreshold} onChange={(e) => setForm({ ...form, highGlucoseThreshold: Number(e.target.value) })} />
        <Input label="Low Glucose Threshold" type="number" value={form.lowGlucoseThreshold} onChange={(e) => setForm({ ...form, lowGlucoseThreshold: Number(e.target.value) })} />
        <Input label="Urgent High Threshold" type="number" value={form.urgentHighThreshold} onChange={(e) => setForm({ ...form, urgentHighThreshold: Number(e.target.value) })} />
        <Input label="Urgent Low Threshold" type="number" value={form.urgentLowThreshold} onChange={(e) => setForm({ ...form, urgentLowThreshold: Number(e.target.value) })} />
      </div>

      <p className="mb-1 mt-4 font-body text-xs font-semibold text-muted">Alert Delivery</p>
      <p className="mb-2 font-body text-xs text-muted">
        Only "In-App" is actually wired up right now — Email/SMS/WhatsApp are saved as preferences for when that delivery infrastructure exists.
      </p>
      <div className="grid grid-cols-2 gap-1">
        <Toggle label="In-App Notifications" checked={form.alertDeliveryInApp} onChange={(v) => setForm({ ...form, alertDeliveryInApp: v })} />
        <Toggle label="Email" checked={form.alertDeliveryEmail} onChange={(v) => setForm({ ...form, alertDeliveryEmail: v })} />
        <Toggle label="SMS" checked={form.alertDeliverySms} onChange={(v) => setForm({ ...form, alertDeliverySms: v })} />
        <Toggle label="WhatsApp" checked={form.alertDeliveryWhatsApp} onChange={(v) => setForm({ ...form, alertDeliveryWhatsApp: v })} />
      </div>
      <SaveButton onClick={handleSave} isSaving={isSaving} saved={saved} />
    </Card>
  );
}
