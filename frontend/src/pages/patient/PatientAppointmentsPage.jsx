// Patient Appointments screen. "New Appointment" here creates a request
// that lands as PENDING — a patient can't confirm their own appointment,
// a doctor/admin does that from their side. The form supports either
// picking an on-platform doctor OR typing a free-text external provider
// (lab, specialist not on the platform) — see the backend's
// providerName/providerType fields, added specifically for this.

import { useEffect, useState } from "react";
import { Plus, Video, MapPin, TrendingUp, TrendingDown, Activity, FileText, X } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { fetchMyAppointments, fetchMyAppointmentStats, fetchMyCalendarSummary, requestAppointment, fetchMyAppointmentRecord } from "../../api/patient.api.js";
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
  const [whenFilter, setWhenFilter] = useState("upcoming");
  const [selectedAptForView, setSelectedAptForView] = useState(null);

  function load() {
    setIsLoading(true);
    Promise.all([fetchMyAppointments({ when: whenFilter }), fetchMyAppointmentStats()])
      .then(([apts, statsData]) => {
        setAppointments(apts);
        setStats(statsData);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [whenFilter]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Upcoming" value={stats?.upcoming} />
        <StatCard label="Completed (Year)" value={stats?.completedThisYear} tone="success" />
        <StatCard label="Total Scheduled (Year)" value={stats?.totalThisYear} />
        <StatCard label="Reminders Set" value={stats?.remindersSet} tone="warning" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["upcoming", "past"].map((filter) => (
            <button
              key={filter}
              onClick={() => setWhenFilter(filter)}
              className={`rounded-lg border px-3.5 py-1.5 font-body text-xs font-medium transition-colors ${
                whenFilter === filter ? "border-primary bg-primary-light text-primary" : "border-border bg-surface text-muted hover:bg-bg"
              }`}
            >
              {filter === "upcoming" ? "Upcoming" : "Past"}
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
          <p className="px-5 py-10 text-center font-body text-sm text-muted">No appointments found.</p>
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
                <span className="flex items-center gap-1 font-body text-xs text-muted shrink-0">
                  {apt.mode === "VIDEO_CALL" ? <Video size={12} /> : <MapPin size={12} />}
                </span>
                <div className="flex items-center gap-2">
                  {apt.status === "COMPLETED" && (
                    <button
                      onClick={() => setSelectedAptForView(apt.id)}
                      className="rounded-lg border border-border px-2.5 py-1 font-body text-xs font-semibold hover:border-primary hover:text-primary transition-colors bg-surface text-muted flex items-center gap-1"
                      title="View Clinical Record"
                    >
                      <Activity size={12} /> View Record
                    </button>
                  )}
                  <span className={`rounded-full px-2.5 py-1 font-body text-xs font-semibold ${STATUS_STYLES[apt.status]}`}>
                    {apt.status.charAt(0) + apt.status.slice(1).toLowerCase()}
                  </span>
                </div>
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

      {selectedAptForView && (
        <PatientRecordModal
          appointmentId={selectedAptForView}
          onClose={() => setSelectedAptForView(null)}
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

function PatientRecordModal({ appointmentId, onClose }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    fetchMyAppointmentRecord(appointmentId)
      .then(setData)
      .catch((err) => {
        setError(err.response?.data?.message || "Couldn't load clinical record.");
      })
      .finally(() => setIsLoading(false));
  }, [appointmentId]);

  function getDiffBadge(field, currentVal, unit) {
    if (!data?.previousRecord) return null;
    const prevVal = data.previousRecord[field];
    if (prevVal === null || prevVal === undefined || currentVal === null || currentVal === undefined) return null;

    const diff = Number((currentVal - prevVal).toFixed(2));
    if (diff === 0) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg text-muted font-medium inline-flex items-center gap-0.5">
          No change
        </span>
      );
    }

    const isPositiveBad = ["weight", "bloodglucose", "systolicbp", "diastolicbp", "pulse", "temperature"].includes(field.toLowerCase());
    const isIncrease = diff > 0;
    let badgeClass = "";
    if (isIncrease) {
      badgeClass = isPositiveBad ? "bg-critical-light text-critical border border-critical/15" : "bg-success-light text-success border border-success/15";
    } else {
      badgeClass = isPositiveBad ? "bg-success-light text-success border border-success/15" : "bg-critical-light text-critical border border-critical/15";
    }

    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-0.5 ${badgeClass}`}>
        {isIncrease ? "+" : ""}{diff} {unit}
        {isIncrease ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
      </span>
    );
  }

  const record = data?.record;
  const bmi = record ? computeBMI(record.weight, record.height) : null;

  function computeBMI(w, h) {
    if (!w || !h) return null;
    const heightM = h / 100;
    return (w / (heightM * heightM)).toFixed(1);
  }

  function getBMICategory(bmiVal) {
    const val = parseFloat(bmiVal);
    if (isNaN(val)) return "";
    if (val < 18.5) return "Underweight";
    if (val < 25) return "Normal";
    if (val < 30) return "Overweight";
    return "Obese";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-card bg-surface p-6 shadow-float max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-ink flex items-center gap-1.5">
              <Activity className="text-primary" size={18} /> Clinical Record from Your Visit
            </h3>
            {data?.appointment && (
              <p className="font-body text-xs text-muted mt-0.5">
                Provider: <span className="font-semibold text-ink">
                  {data.appointment.doctor?.fullName ? `Dr. ${data.appointment.doctor.fullName}` : data.appointment.providerName}
                </span> | Date: {new Date(data.appointment.scheduledAt).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <p className="py-10 text-center font-body text-sm text-muted">Loading your clinical record…</p>
        ) : error ? (
          <div className="rounded-lg bg-critical-light p-4 border border-critical/20 text-center">
            <p className="font-body text-sm text-critical font-medium">{error}</p>
          </div>
        ) : !record ? (
          <div className="rounded-lg bg-bg p-8 border border-border text-center">
            <p className="font-body text-sm text-muted">No measurements or clinical details were recorded for this appointment.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Vitals grid */}
              <div className="flex flex-col gap-3">
                <p className="font-display text-xs font-bold text-ink uppercase tracking-wider border-b border-border pb-1">Vitals & Measurements</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg/40 p-3 rounded-lg border border-border flex flex-col gap-1">
                    <span className="font-body text-[10px] font-semibold text-muted uppercase">Weight</span>
                    <span className="numeral text-lg font-bold text-ink">
                      {record.weight ? `${record.weight} kg` : "—"}
                    </span>
                    {getDiffBadge("weight", record.weight, "kg")}
                  </div>

                  <div className="bg-bg/40 p-3 rounded-lg border border-border flex flex-col gap-1">
                    <span className="font-body text-[10px] font-semibold text-muted uppercase">Height</span>
                    <span className="numeral text-lg font-bold text-ink">
                      {record.height ? `${record.height} cm` : "—"}
                    </span>
                    {getDiffBadge("height", record.height, "cm")}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg/40 p-3 rounded-lg border border-border flex flex-col gap-1">
                    <span className="font-body text-[10px] font-semibold text-muted uppercase">Blood Pressure</span>
                    <span className="numeral text-lg font-bold text-ink">
                      {record.systolicBP && record.diastolicBP ? `${record.systolicBP}/${record.diastolicBP} mmHg` : "—"}
                    </span>
                    <div className="flex gap-1.5 mt-1">
                      {getDiffBadge("systolicBP", record.systolicBP, "sys")}
                      {getDiffBadge("diastolicBP", record.diastolicBP, "dia")}
                    </div>
                  </div>

                  <div className="bg-bg/40 p-3 rounded-lg border border-border flex flex-col gap-1">
                    <span className="font-body text-[10px] font-semibold text-muted uppercase">Heart Rate</span>
                    <span className="numeral text-lg font-bold text-ink">
                      {record.pulse ? `${record.pulse} bpm` : "—"}
                    </span>
                    {getDiffBadge("pulse", record.pulse, "bpm")}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg/40 p-3 rounded-lg border border-border flex flex-col gap-1">
                    <span className="font-body text-[10px] font-semibold text-muted uppercase">Temperature</span>
                    <span className="numeral text-lg font-bold text-ink">
                      {record.temperature ? `${record.temperature} °C` : "—"}
                    </span>
                    {getDiffBadge("temperature", record.temperature, "°C")}
                  </div>

                  <div className="bg-bg/40 p-3 rounded-lg border border-border flex flex-col gap-1">
                    <span className="font-body text-[10px] font-semibold text-muted uppercase">Blood Glucose</span>
                    <span className="numeral text-lg font-bold text-ink">
                      {record.bloodGlucose ? `${record.bloodGlucose} mg/dL` : "—"}
                    </span>
                    {getDiffBadge("bloodGlucose", record.bloodGlucose, "mg/dL")}
                  </div>
                </div>

                {bmi && (
                  <div className="bg-primary-light/30 p-3 rounded-lg border border-primary-light flex items-center justify-between">
                    <div>
                      <span className="font-body text-[10px] font-semibold text-muted uppercase block">Body Mass Index (BMI)</span>
                      <span className="font-body text-xs font-semibold text-primary mt-0.5 block">{getBMICategory(bmi)}</span>
                    </div>
                    <span className="numeral text-2xl font-bold text-primary">{bmi}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Notes & Recommendations */}
              <div className="flex flex-col gap-4">
                <div>
                  <p className="font-display text-xs font-bold text-ink uppercase tracking-wider border-b border-border pb-1 mb-2">Observations & Notes</p>
                  <div className="bg-bg/40 p-4 rounded-lg border border-border min-h-[100px] font-body text-sm text-ink whitespace-pre-line">
                    {record.notes || "No clinical observations or notes recorded for this visit."}
                  </div>
                </div>

                <div>
                  <p className="font-display text-xs font-bold text-ink uppercase tracking-wider border-b border-border pb-1 mb-2">Prescription & Next Steps</p>
                  <div className="bg-primary-light/10 p-4 rounded-lg border border-primary/10 min-h-[100px] font-body text-sm text-ink whitespace-pre-line border-l-4 border-l-primary">
                    {record.prescription || "No prescriptions or adjustments recorded."}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end border-t border-border pt-4">
              <Button onClick={onClose}>
                Close Record
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
