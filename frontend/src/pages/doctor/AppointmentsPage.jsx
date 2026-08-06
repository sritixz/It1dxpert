// Appointments screen. The calendar widget is hand-built (day grid + dot
// indicators from the backend's per-day status counts) rather than a
// calendar library, since the mockup's calendar is simple enough not to
// need one — one fewer dependency for something this contained.

import { useEffect, useState } from "react";
import { Plus, Video, MapPin, TrendingUp, TrendingDown, Activity, FileText, X } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Input } from "../../components/ui/Input.jsx";
import {
  fetchAppointments, fetchAppointmentStats, fetchCalendarSummary,
  createAppointment, updateAppointmentStatus, fetchPatients,
  fetchAppointmentRecord, saveAppointmentRecord,
} from "../../api/doctor.api.js";
import { formatTime } from "../../utils/format.js";

const TABS = [
  { key: undefined, label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

const STATUS_STYLES = {
  PENDING: "bg-warning-light text-warning",
  CONFIRMED: "bg-success-light text-success",
  COMPLETED: "bg-primary-light text-primary",
  CANCELLED: "bg-critical-light text-critical",
};

const STATUS_DOT = {
  PENDING: "bg-warning",
  CONFIRMED: "bg-success",
  COMPLETED: "bg-primary",
  CANCELLED: "bg-critical",
};

export function AppointmentsPage() {
  const [status, setStatus] = useState(undefined);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAptForRecord, setSelectedAptForRecord] = useState(null);

  function load() {
    setIsLoading(true);
    Promise.all([fetchAppointments({ status }), fetchAppointmentStats()])
      .then(([apts, statsData]) => {
        setAppointments(apts);
        setStats(statsData);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [status]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Today" value={stats?.today} />
          <StatCard label="Upcoming (7 Days)" value={stats?.upcoming7Days} />
          <StatCard label="Pending" value={stats?.pending} tone="warning" />
          <StatCard label="Completed (Month)" value={stats?.completedThisMonth} tone="success" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => setStatus(tab.key)}
                  className={`rounded-lg border px-3 py-1.5 font-body text-xs font-medium transition-colors ${
                    status === tab.key ? "border-primary bg-primary-light text-primary" : "border-border bg-surface text-muted hover:bg-bg"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Button onClick={() => setShowModal(true)} className="!px-3 !py-1.5 text-xs">
              <Plus size={14} /> New Appointment
            </Button>
          </div>

          <Card className="p-0">
            {isLoading ? (
              <p className="px-5 py-10 text-center font-body text-sm text-muted">Loading appointments…</p>
            ) : appointments.length === 0 ? (
              <p className="px-5 py-10 text-center font-body text-sm text-muted">No appointments match this filter.</p>
            ) : (
              <ul>
                {appointments.map((apt) => (
                  <li key={apt.id} className="flex items-center gap-4 border-b border-border px-5 py-3.5 last:border-0">
                    <div className="w-16 shrink-0">
                      <p className="numeral text-sm font-semibold text-ink">{formatTime(apt.scheduledAt)}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-body text-sm font-semibold text-ink">{apt.patient.fullName}</p>
                      <p className="font-body text-xs text-muted">{apt.type} — {apt.purpose || "No purpose specified"}</p>
                    </div>
                    <span className="flex items-center gap-1 font-body text-xs text-muted shrink-0">
                      {apt.mode === "VIDEO_CALL" ? <Video size={12} /> : <MapPin size={12} />}
                      {apt.mode === "VIDEO_CALL" ? "Video Call" : "In Clinic"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedAptForRecord(apt.id)}
                        className="rounded-lg border border-border px-2.5 py-1 font-body text-xs font-semibold hover:border-primary hover:text-primary transition-colors flex items-center gap-1 bg-surface text-muted"
                        title="Vitals & Clinical Record"
                      >
                        <Activity size={12} /> Vitals & Record
                      </button>
                      <select
                        value={apt.status}
                        onChange={async (e) => {
                          await updateAppointmentStatus(apt.id, e.target.value);
                          load();
                        }}
                        className={`rounded-full border-0 px-2.5 py-1 font-body text-xs font-semibold ${STATUS_STYLES[apt.status]}`}
                      >
                        {Object.keys(STATUS_STYLES).map((s) => (
                          <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <CalendarWidget />
      </div>

      {showModal && (
        <NewAppointmentModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      {selectedAptForRecord && (
        <ClinicalRecordModal
          appointmentId={selectedAptForRecord}
          onClose={() => {
            setSelectedAptForRecord(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const toneClass = { warning: "text-warning", success: "text-success" }[tone] || "text-ink";
  return (
    <Card className="p-4">
      <p className="font-body text-xs font-medium text-muted">{label}</p>
      <p className={`numeral mt-1 text-2xl font-semibold ${toneClass}`}>{value ?? "—"}</p>
    </Card>
  );
}

function CalendarWidget() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [summary, setSummary] = useState({});

  useEffect(() => {
    fetchCalendarSummary(year, month).then(setSummary);
  }, [year, month]);

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = firstDay.getDay();
  const cells = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const monthLabel = firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  function changeMonth(delta) {
    const next = new Date(year, month - 1 + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-sm font-bold text-ink">{monthLabel}</p>
        <div className="flex gap-1">
          <button onClick={() => changeMonth(-1)} className="rounded px-2 text-muted hover:bg-bg">‹</button>
          <button onClick={() => changeMonth(1)} className="rounded px-2 text-muted hover:bg-bg">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="font-body text-[10px] font-semibold text-muted">{d}</span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayStatuses = Object.keys(summary[dateKey] || {});
          const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
          return (
            <div key={i} className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 ${isToday ? "bg-primary-light" : ""}`}>
              <span className={`font-body text-xs ${isToday ? "font-bold text-primary" : "text-ink"}`}>{day}</span>
              <div className="flex gap-0.5">
                {dayStatuses.slice(0, 3).map((s) => (
                  <span key={s} className={`h-1 w-1 rounded-full ${STATUS_DOT[s]}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function NewAppointmentModal({ onClose, onCreated }) {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    patientId: "", scheduledAt: "", type: "Follow-up", purpose: "", mode: "IN_CLINIC",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPatients({ pageSize: 100 }).then((res) => setPatients(res.patients));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      await createAppointment(form);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create appointment.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title="New Appointment" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="mb-1.5 block font-body text-sm font-medium text-ink">Patient</label>
          <select
            required
            value={form.patientId}
            onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            className="w-full rounded-lg border border-border px-3.5 py-2.5 font-body text-sm"
          >
            <option value="">Select a patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.fullName}</option>
            ))}
          </select>
        </div>
        <Input label="Date & Time" type="datetime-local" required value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
        <div>
          <label className="mb-1.5 block font-body text-sm font-medium text-ink">Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-border px-3.5 py-2.5 font-body text-sm">
            <option>Follow-up</option>
            <option>Consultation</option>
          </select>
        </div>
        <Input label="Purpose" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Routine Checkup" />
        <div>
          <label className="mb-1.5 block font-body text-sm font-medium text-ink">Mode</label>
          <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="w-full rounded-lg border border-border px-3.5 py-2.5 font-body text-sm">
            <option value="IN_CLINIC">In Clinic</option>
            <option value="VIDEO_CALL">Video Call</option>
          </select>
        </div>
        {error && <p className="font-body text-sm text-critical">{error}</p>}
        <Button type="submit" isLoading={isSaving} className="mt-2 w-full">Create Appointment</Button>
      </form>
    </Modal>
  );
}

export function ClinicalRecordModal({ appointmentId, onClose }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({
    weight: "", height: "", systolicBP: "", diastolicBP: "",
    pulse: "", temperature: "", bloodGlucose: "", notes: "", prescription: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchAppointmentRecord(appointmentId)
      .then((res) => {
        setData(res);
        if (res.record) {
          setForm({
            weight: res.record.weight ?? "",
            height: res.record.height ?? "",
            systolicBP: res.record.systolicBP ?? "",
            diastolicBP: res.record.diastolicBP ?? "",
            pulse: res.record.pulse ?? "",
            temperature: res.record.temperature ?? "",
            bloodGlucose: res.record.bloodGlucose ?? "",
            notes: res.record.notes ?? "",
            prescription: res.record.prescription ?? "",
          });
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Couldn't load clinical record.");
      })
      .finally(() => setIsLoading(false));
  }, [appointmentId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess(false);
    try {
      await saveAppointmentRecord(appointmentId, form);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save clinical record.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleInputChange(field, val) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  function renderFieldDiff(field, currentVal, unit) {
    if (!data?.previousRecord) return null;
    const prevVal = data.previousRecord[field];
    if (prevVal === null || prevVal === undefined) return null;

    const parsedCurrent = parseFloat(currentVal);
    if (isNaN(parsedCurrent)) {
      return (
        <span className="text-[10px] font-body text-muted mt-0.5 block">
          Previous: {prevVal} {unit}
        </span>
      );
    }

    const diff = Number((parsedCurrent - prevVal).toFixed(2));
    if (diff === 0) {
      return (
        <span className="text-[10px] font-body text-muted mt-0.5 block flex items-center gap-0.5">
          Previous: {prevVal} {unit} (No change)
        </span>
      );
    }

    const isPositiveBad = ["weight", "bloodglucose", "systolicbp", "diastolicbp", "pulse", "temperature"].includes(field.toLowerCase());
    const isIncrease = diff > 0;
    let colorClass = "text-muted";
    if (isIncrease) {
      colorClass = isPositiveBad ? "text-critical" : "text-success";
    } else {
      colorClass = isPositiveBad ? "text-success" : "text-critical";
    }

    return (
      <span className={`text-[10px] font-body font-medium mt-0.5 block flex items-center gap-0.5 ${colorClass}`}>
        Previous: {prevVal} {unit} ({isIncrease ? "+" : ""}{diff} {unit})
        {isIncrease ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      </span>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-card bg-surface p-6 shadow-float max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-ink">
              Clinical Record & Vitals
            </h3>
            {data?.appointment && (
              <p className="font-body text-xs text-muted mt-0.5">
                Patient: <span className="font-semibold text-ink">{data.appointment.patient.fullName}</span> | Date: {new Date(data.appointment.scheduledAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <p className="py-10 text-center font-body text-sm text-muted">Loading clinical record data…</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-critical-light p-3 border border-critical/20">
                <p className="font-body text-xs text-critical font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-success-light p-3 border border-success/20">
                <p className="font-body text-xs text-success font-medium">Clinical record saved successfully! Closing...</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Vitals Form */}
              <div className="flex flex-col gap-3">
                <p className="font-display text-xs font-bold text-ink uppercase tracking-wider border-b border-border pb-1">Vitals & Measurements</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      label="Weight (kg)"
                      type="number"
                      step="0.01"
                      value={form.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                      placeholder="e.g. 70.5"
                    />
                    {renderFieldDiff("weight", form.weight, "kg")}
                  </div>
                  <div>
                    <Input
                      label="Height (cm)"
                      type="number"
                      step="0.1"
                      value={form.height}
                      onChange={(e) => handleInputChange("height", e.target.value)}
                      placeholder="e.g. 175"
                    />
                    {renderFieldDiff("height", form.height, "cm")}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      label="Systolic BP (mmHg)"
                      type="number"
                      value={form.systolicBP}
                      onChange={(e) => handleInputChange("systolicBP", e.target.value)}
                      placeholder="e.g. 120"
                    />
                    {renderFieldDiff("systolicBP", form.systolicBP, "mmHg")}
                  </div>
                  <div>
                    <Input
                      label="Diastolic BP (mmHg)"
                      type="number"
                      value={form.diastolicBP}
                      onChange={(e) => handleInputChange("diastolicBP", e.target.value)}
                      placeholder="e.g. 80"
                    />
                    {renderFieldDiff("diastolicBP", form.diastolicBP, "mmHg")}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      label="Pulse (bpm)"
                      type="number"
                      value={form.pulse}
                      onChange={(e) => handleInputChange("pulse", e.target.value)}
                      placeholder="e.g. 72"
                    />
                    {renderFieldDiff("pulse", form.pulse, "bpm")}
                  </div>
                  <div>
                    <Input
                      label="Temperature (°C)"
                      type="number"
                      step="0.1"
                      value={form.temperature}
                      onChange={(e) => handleInputChange("temperature", e.target.value)}
                      placeholder="e.g. 36.6"
                    />
                    {renderFieldDiff("temperature", form.temperature, "°C")}
                  </div>
                </div>

                <div>
                  <Input
                    label="Blood Glucose (mg/dL)"
                    type="number"
                    step="0.1"
                    value={form.bloodGlucose}
                    onChange={(e) => handleInputChange("bloodGlucose", e.target.value)}
                    placeholder="e.g. 110"
                  />
                  {renderFieldDiff("bloodGlucose", form.bloodGlucose, "mg/dL")}
                </div>
              </div>

              {/* Right Column: Text Observations */}
              <div className="flex flex-col gap-3">
                <p className="font-display text-xs font-bold text-ink uppercase tracking-wider border-b border-border pb-1">Clinical Notes & Recommendations</p>
                
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-sm font-medium text-ink">Clinical Notes & Observations</label>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Describe symptoms, patient comments, details of physical checkup..."
                    className="w-full rounded-lg border border-border px-3.5 py-2.5 font-body text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-sm font-medium text-ink">Prescriptions & Next Steps</label>
                  <textarea
                    rows={4}
                    value={form.prescription}
                    onChange={(e) => handleInputChange("prescription", e.target.value)}
                    placeholder="Medications prescribed, insulin doses adjust, tests ordered, next follow-up instructions..."
                    className="w-full rounded-lg border border-border px-3.5 py-2.5 font-body text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving}>
                Save & Mark Completed
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
