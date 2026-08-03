// Patient Settings screen. Scoped deliberately to what was agreed as
// "the non-device parts" — Account (profile + password), Emergency
// Contact, App Preferences, and Data & Privacy (export only). NOT here:
// Connected Devices (blocked on the device-integration decision) and
// Delete Account (needs a real conversation with PGI about what "delete"
// means for a medical record — not something to build unilaterally).

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import {
  fetchPatientSettings, updatePatientProfile, updateEmergencyContact,
  updatePatientPreferences, changePassword, exportPatientData,
} from "../../api/patient.api.js";

export function PatientSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPatientSettings().then(setSettings).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <p className="font-body text-sm text-muted">Loading settings…</p>;
  if (!settings) return <p className="font-body text-sm text-critical">Couldn't load settings.</p>;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ProfilePanel settings={settings} onSaved={setSettings} />
      <PasswordPanel />
      <EmergencyContactPanel settings={settings} onSaved={setSettings} />
      <PreferencesPanel settings={settings} onSaved={setSettings} />
      <DataPrivacyPanel />
    </div>
  );
}

function SaveButton({ isSaving, saved }) {
  return (
    <Button type="submit" isLoading={isSaving} className="mt-2">
      {saved ? "Saved ✓" : "Save Changes"}
    </Button>
  );
}

function ProfilePanel({ settings, onSaved }) {
  const [form, setForm] = useState({ fullName: settings.fullName || "", phone: settings.user?.phone || "" });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    try {
      const updated = await updatePatientProfile(form);
      onSaved((prev) => ({ ...prev, ...updated }));
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <p className="mb-4 font-display text-sm font-bold text-ink">Personal Information</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <Input label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Email" value={settings.user?.email || ""} disabled className="opacity-60" />
        <SaveButton isSaving={isSaving} saved={saved} />
      </form>
    </Card>
  );
}

function PasswordPanel() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    setError("");
    try {
      await changePassword(form);
      setForm({ currentPassword: "", newPassword: "" });
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't change password.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <p className="mb-1 font-display text-sm font-bold text-ink">Login & Security</p>
      <p className="mb-4 font-body text-xs text-muted">Change your password.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input label="Current Password" type="password" required value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        <Input label="New Password" type="password" required minLength={8} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} placeholder="At least 8 characters" />
        {error && <p className="font-body text-sm text-critical">{error}</p>}
        <SaveButton isSaving={isSaving} saved={saved} />
      </form>
    </Card>
  );
}

function EmergencyContactPanel({ settings, onSaved }) {
  const [form, setForm] = useState({
    emergencyContactName: settings.emergencyContactName || "",
    emergencyContactPhone: settings.emergencyContactPhone || "",
    emergencyContactRelation: settings.emergencyContactRelation || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    try {
      const updated = await updateEmergencyContact(form);
      onSaved((prev) => ({ ...prev, ...updated }));
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <p className="mb-4 font-display text-sm font-bold text-ink">Emergency Contact</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input label="Name" value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} />
        <Input label="Phone" value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} />
        <Input label="Relationship" value={form.emergencyContactRelation} onChange={(e) => setForm({ ...form, emergencyContactRelation: e.target.value })} placeholder="e.g. Parent, Spouse" />
        <SaveButton isSaving={isSaving} saved={saved} />
      </form>
    </Card>
  );
}

function PreferencesPanel({ settings, onSaved }) {
  const [form, setForm] = useState({
    preferredUnits: settings.preferredUnits || "mg/dL",
    timezone: settings.timezone || "Asia/Kolkata",
    language: settings.language || "en",
    theme: settings.theme || "light",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    try {
      const updated = await updatePatientPreferences(form);
      onSaved((prev) => ({ ...prev, ...updated }));
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <p className="mb-4 font-display text-sm font-bold text-ink">App Preferences</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="mb-1.5 block font-body text-sm font-medium text-ink">Units</label>
          <select value={form.preferredUnits} onChange={(e) => setForm({ ...form, preferredUnits: e.target.value })} className="w-full rounded-lg border border-border px-3.5 py-2.5 font-body text-sm">
            <option value="mg/dL">mg/dL</option>
            <option value="mmol/L">mmol/L</option>
          </select>
        </div>
        <Input label="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
        <div>
          <label className="mb-1.5 block font-body text-sm font-medium text-ink">Theme</label>
          <select value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} className="w-full rounded-lg border border-border px-3.5 py-2.5 font-body text-sm">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <SaveButton isSaving={isSaving} saved={saved} />
      </form>
    </Card>
  );
}

function DataPrivacyPanel() {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await exportPatientData();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "diabetescare-export.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Card>
      <p className="mb-4 font-display text-sm font-bold text-ink">Data & Privacy</p>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left hover:bg-bg disabled:opacity-50"
      >
        <div>
          <p className="font-body text-sm font-medium text-ink">Export My Data</p>
          <p className="font-body text-xs text-muted">Download your logged data in CSV format.</p>
        </div>
        <Download size={16} className="text-muted" />
      </button>

      {/* Delete Account deliberately not offered here — see file header
          comment for why this needs a decision with PGI Chandigarh first. */}
      <p className="mt-4 font-body text-xs text-muted">
        Need to delete your account? Contact your care team's support to request this.
      </p>
    </Card>
  );
}
