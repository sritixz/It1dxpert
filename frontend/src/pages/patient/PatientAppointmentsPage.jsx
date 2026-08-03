// Patient Appointments screen. "New Appointment" here creates a request
// that lands as PENDING — a patient can't confirm their own appointment,
// a doctor/admin does that from their side. The form supports either
// picking an on-platform doctor OR typing a free-text external provider
// (lab, specialist not on the platform) — see the backend's
// providerName/providerType fields, added specifically for this.

import { useEffect, useState } from "react";
import { Plus, Video, MapPin } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { fetchMyAppointments, fetchMyAppointmentStats, fetchMyCalendarSummary, requestAppointment } from "../../api/patient.api.js";
import { formatTime } from "../../utils/format.js";

const STATUS_STYLES = {
  PENDING: "bg-warning-light text-warning",
  CONFIRMED: "bg-success-light text-success",
  COMPLETED: "bg-primary-light text-primary",
  CANCELLED: "bg-critical-light text-critical",
};

export function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  function load() {
    setIsLoading(true);
    Promise.all([fetchMyAppointments({ when: "upcoming" }), fetchMyAppointmentStats()])
      .then(([apts, statsData]) => {
        setAppointments(apts);
        setStats(statsData);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Upcoming" value={stats?.upcoming} />
        <StatCard label="Completed (Year)" value={stats?.completedThisYear} tone="success" />
        <StatCard label="Total Scheduled (Year)" value={stats?.totalThisYear} />
        <StatCard label="Reminders Set" value={stats?.remindersSet} tone="warning" />
      </div>

      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-bold text-ink">Upcoming Appointments</p>
        <Button onClick={() => setShowModal(true)} className="!px-3 !py-1.5 text-xs">
          <Plus size={14} /> New Appointment
        </Button>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <p className="px-5 py-10 text-center font-body text-sm text-muted">Loading appointments…</p>
        ) : appointments.length === 0 ? (
          <p className="px-5 py-10 text-center font-body text-sm text-muted">No upcoming appointments.</p>
        ) : (
          <ul>
            {appointments.map((apt) => (
              <li key={apt.id} className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-0">
                <div className="w-28 shrink-0">
                  <p className="font-body text-xs text-muted">{new Date(apt.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  <p className="numeral text-sm font-semibold text-ink">{formatTime(apt.scheduledAt)}</p>
                </div>
                <div className="flex-1">
                  <p className="font-body text-sm font-semibold text-ink">{apt.type}</p>
                  <p className="font-body text-xs text-muted">
                    {apt.doctor?.fullName ? `Dr. ${apt.doctor.fullName}` : apt.providerName}
                    {apt.providerType ? ` — ${apt.providerType}` : apt.doctor?.specialization ? ` — ${apt.doctor.specialization}` : ""}
                  </p>
                  {apt.location && <p className="font-body text-xs text-muted">{apt.location}</p>}
                </div>
                <span className="flex items-center gap-1 font-body text-xs text-muted">
                  {apt.mode === "VIDEO_CALL" ? <Video size={12} /> : <MapPin size={12} />}
                </span>
                <span className={`rounded-full px-2.5 py-1 font-body text-xs font-semibold ${STATUS_STYLES[apt.status]}`}>
                  {apt.status.charAt(0) + apt.status.slice(1).toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {showModal && (
        <RequestAppointmentModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const toneClass = { success: "text-success", warning: "text-warning" }[tone] || "text-ink";
  return (
    <Card className="p-4">
      <p className="font-body text-xs font-medium text-muted">{label}</p>
      <p className={`numeral mt-1 text-2xl font-semibold ${toneClass}`}>{value ?? "—"}</p>
    </Card>
  );
}

function RequestAppointmentModal({ onClose, onCreated }) {
  // Always free-text provider fields (not a doctorId picker) — there's no
  // patient-accessible "list doctors in my hospital" endpoint yet (only
  // HOSPITAL_ADMIN/SUPER_ADMIN can list doctors currently). Worth adding
  // a public-within-hospital doctor list later so a patient can pick a
  // real on-platform doctor instead of typing a name.
  const [form, setForm] = useState({
    providerName: "", providerType: "", scheduledAt: "", type: "Follow-up", purpose: "", mode: "IN_CLINIC",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      await requestAppointment(form);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't request appointment.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title="Request an Appointment" onClose={onClose}>
      <p className="mb-3 font-body text-xs text-muted">
        This sends a request — your care team will confirm the exact time.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input label="Provider / Doctor Name" required value={form.providerName} onChange={(e) => setForm({ ...form, providerName: e.target.value })} placeholder="e.g. Dr. Sarah Johnson" />
        <Input label="Provider Type" value={form.providerType} onChange={(e) => setForm({ ...form, providerType: e.target.value })} placeholder="e.g. Endocrinologist, Lab" />
        <Input label="Preferred Date & Time" type="datetime-local" required value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
        <Input label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Follow-up, Lab Test" />
        <Input label="Purpose" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="What's this visit for?" />
        <div>
          <label className="mb-1.5 block font-body text-sm font-medium text-ink">Mode</label>
          <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="w-full rounded-lg border border-border px-3.5 py-2.5 font-body text-sm">
            <option value="IN_CLINIC">In Clinic</option>
            <option value="VIDEO_CALL">Video Call</option>
          </select>
        </div>
        {error && <p className="font-body text-sm text-critical">{error}</p>}
        <Button type="submit" isLoading={isSaving} className="mt-2 w-full">Request Appointment</Button>
      </form>
    </Modal>
  );
}
