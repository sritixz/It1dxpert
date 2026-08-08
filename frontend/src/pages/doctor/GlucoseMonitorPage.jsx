// Glucose Monitor — single-patient detail. Time-range tabs are limited to
// 7/14/30/90 days on purpose: the reference mockup shows intraday tabs
// (3H/6H/12H/24H) too, but the backend's getGlucoseTrends only supports
// day-granularity ranges — offering hour tabs that don't actually change
// anything would be a UI that lies about what it does.

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Droplet, Syringe, UtensilsCrossed, Footprints, StickyNote,
  FolderOpen, FileText, Eye, Trash2, Upload, Loader2, Calendar
} from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceArea, ReferenceLine,
} from "recharts";
import { Card } from "../../components/ui/Card.jsx";
import { fetchPatientOverview, fetchPatientGlucoseTrends, fetchPatientTimeline, fetchPatientAppointmentRecords } from "../../api/doctor.api.js";
import { 
  fetchPatientDocumentsForDoctor, 
  uploadPrescriptionForPatient, 
  deletePatientDocumentForDoctor 
} from "../../api/document.api.js";
import { ClinicalRecordModal } from "./AppointmentsPage.jsx";
import { formatTime, formatRelativeTime } from "../../utils/format.js";

const RANGE_OPTIONS = [
  { days: 7, label: "7D" },
  { days: 14, label: "14D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
];

const EVENT_CONFIG = {
  GLUCOSE: { icon: Droplet, color: "text-primary bg-primary-light", label: (d) => `Glucose ${d.value} mg/dL${d.context ? ` — ${d.context}` : ""}` },
  INSULIN: { icon: Syringe, color: "text-critical bg-critical-light", label: (d) => `Insulin ${d.units}u${d.insulinType ? ` — ${d.insulinType}` : ""}` },
  MEAL: { icon: UtensilsCrossed, color: "text-warning bg-warning-light", label: (d) => `${d.mealType || "Meal"} — ${d.carbs}g carbs` },
  ACTIVITY: { icon: Footprints, color: "text-success bg-success-light", label: (d) => `${d.activityType || "Activity"} — ${d.durationMins} min` },
  NOTE: { icon: StickyNote, color: "text-muted bg-bg", label: (d) => d.content },
};

export function GlucoseMonitorPage() {
  const { patientId } = useParams();
  const [days, setDays] = useState(7);
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [apptRecords, setApptRecords] = useState([]);
  const [selectedAptId, setSelectedAptId] = useState(null);

  // Document states
  const [documents, setDocuments] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadApptId, setUploadApptId] = useState("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docError, setDocError] = useState("");

  function loadRecords() {
    fetchPatientAppointmentRecords(patientId).then(setApptRecords).catch(() => {});
  }

  function loadDocuments() {
    fetchPatientDocumentsForDoctor(patientId).then(setDocuments).catch(() => {});
  }

  // Patient name/header info only needs fetching once, not on range change.
  useEffect(() => {
    fetchPatientOverview(patientId).catch(() => {}).then((data) => data && setOverview(data));
    loadRecords();
    loadDocuments();
  }, [patientId]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");

    Promise.all([fetchPatientGlucoseTrends(patientId, days), fetchPatientTimeline(patientId, 20)])
      .then(([trendsData, timelineData]) => {
        if (cancelled) return;
        setTrends(trendsData);
        setTimeline(timelineData);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "Couldn't load glucose data for this patient.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patientId, days]);

  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setDocError("Please select a file.");
      return;
    }
    setIsUploadingDoc(true);
    setDocError("");

    try {
      await uploadPrescriptionForPatient(patientId, {
        file: uploadFile,
        notes: uploadNotes,
        appointmentId: uploadApptId || undefined,
        customName: uploadName || undefined,
      });
      setUploadFile(null);
      setUploadName("");
      setUploadNotes("");
      setUploadApptId("");
      setShowUploadForm(false);
      loadDocuments();
    } catch (err) {
      console.error("Prescription upload error:", err);
      setDocError("Failed to upload prescription.");
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDocDelete = async (docId) => {
    if (!confirm("Delete this document?")) return;
    try {
      await deletePatientDocumentForDoctor(patientId, docId);
      loadDocuments();
    } catch (err) {
      console.error("Delete doc error:", err);
      alert("Failed to delete document.");
    }
  };

  const chartData = trends?.series.map((point) => ({
    ...point,
    label: formatTime(point.loggedAt),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/doctor/patients" className="mb-1 inline-flex items-center gap-1 font-body text-xs font-medium text-muted hover:text-ink">
            <ArrowLeft size={12} /> Back to patients
          </Link>
          <h2 className="font-display text-xl font-bold text-ink">
            {overview?.patient?.fullName || "Glucose Monitor"}
          </h2>
        </div>

        <div className="flex gap-1.5 rounded-lg border border-border bg-surface p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setDays(opt.days)}
              className={`rounded-md px-3 py-1.5 font-body text-xs font-semibold transition-colors ${
                days === opt.days ? "bg-primary text-white" : "text-muted hover:bg-bg"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Card className="border-critical/30 bg-critical-light">
          <p className="font-body text-sm text-critical">{error}</p>
        </Card>
      )}

      {isLoading && !trends ? (
        <Card>
          <p className="font-body text-sm text-muted">Loading glucose data…</p>
        </Card>
      ) : trends ? (
        <>
          {/* Stat cards — every value here comes directly from the backend's
              getGlucoseTrends response, no client-side computation. */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Average" value={trends.stats.average} unit="mg/dL" />
            <StatCard label="Highest" value={trends.stats.highest} unit="mg/dL" />
            <StatCard label="Lowest" value={trends.stats.lowest} unit="mg/dL" />
            <StatCard label="Std. Deviation" value={trends.stats.stdDeviation} unit="mg/dL" />
            <StatCard label="Coeff. of Variation" value={trends.stats.coefficientOfVariation} unit="%" />
            <StatCard label="GMI (est.)" value={trends.insights.gmi} unit="%" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <StatCard label="Time in Range" value={trends.insights.inRangePercent} unit="%" tone="success" />
            <StatCard label="High (>180 mg/dL)" value={trends.insights.highPercent} unit="%" tone="critical" />
            <StatCard label="Low (<70 mg/dL)" value={trends.insights.lowPercent} unit="%" tone="warning" />
          </div>

          {/* Trend chart */}
          <Card>
            <p className="mb-4 font-display text-sm font-bold text-ink">Glucose Trend</p>
            {chartData?.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartData} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5B6B82" }} minTickGap={24} />
                  <YAxis domain={[0, 300]} tick={{ fontSize: 11, fill: "#5B6B82" }} />
                  <Tooltip
                    formatter={(value) => [`${value} mg/dL`, "Glucose"]}
                    contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }}
                  />
                  <ReferenceArea y1={70} y2={180} fill="#2F9E6E" fillOpacity={0.08} />
                  <ReferenceLine y={180} stroke="#C4432E" strokeDasharray="4 4" />
                  <ReferenceLine y={70} stroke="#C2831F" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="value" stroke="#2B6CB0" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center font-body text-sm text-muted">
                No glucose readings logged in this period yet.
              </p>
            )}
          </Card>

          {/* Merged event timeline */}
          <Card>
            <p className="mb-4 font-display text-sm font-bold text-ink">Recent Events</p>
            {timeline.length === 0 ? (
              <p className="font-body text-sm text-muted">No events logged yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {timeline.map((event, i) => {
                  const config = EVENT_CONFIG[event.type];
                  const Icon = config?.icon || StickyNote;
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config?.color || "bg-bg text-muted"}`}>
                        <Icon size={15} />
                      </div>
                      <div className="flex-1">
                        <p className="font-body text-sm text-ink">{config?.label(event.data) || event.type}</p>
                        <p className="font-body text-xs text-muted">{formatRelativeTime(event.at)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Vitals & Clinical Record History */}
          <Card>
            <p className="mb-4 font-display text-sm font-bold text-ink">Clinical Vitals & Appointment History</p>
            {apptRecords.length === 0 ? (
              <p className="font-body text-sm text-muted">No clinical records stored yet for this patient.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body text-xs text-ink">
                  <thead className="border-b border-border bg-bg/40">
                    <tr>
                      {["Date", "Weight", "BP", "Glucose", "Doctor", "Notes", ""].map((h) => (
                        <th key={h} className="px-3 py-2 font-semibold uppercase tracking-wider text-muted">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {apptRecords.map((apt) => {
                      const rec = apt.appointmentRecord;
                      return (
                        <tr key={apt.id} className="border-b border-border last:border-0 hover:bg-bg/20">
                          <td className="px-3 py-3 font-semibold">
                            {new Date(apt.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="px-3 py-3 text-muted">
                            {rec?.weight ? `${rec.weight} kg` : "—"}
                          </td>
                          <td className="px-3 py-3 text-muted">
                            {rec?.systolicBP && rec?.diastolicBP ? `${rec.systolicBP}/${rec.diastolicBP}` : "—"}
                          </td>
                          <td className="px-3 py-3 text-muted">
                            {rec?.bloodGlucose ? `${rec.bloodGlucose} mg/dL` : "—"}
                          </td>
                          <td className="px-3 py-3 text-muted font-medium">
                            {apt.doctor?.fullName || "—"}
                          </td>
                          <td className="px-3 py-3 text-muted max-w-[180px] truncate" title={rec?.notes || ""}>
                            {rec?.notes || "No notes"}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              onClick={() => setSelectedAptId(apt.id)}
                              className="rounded-lg border border-border px-2.5 py-1 font-semibold hover:border-primary hover:text-primary transition-colors bg-surface text-muted"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Medical Files & Doctor Prescriptions */}
          <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b border-border/50 pb-3">
              <div>
                <p className="font-display text-sm font-bold text-ink">Medical Files & Prescriptions</p>
                <p className="font-body text-xs text-muted">Urine/blood reports uploaded by the patient, and prescriptions logged by doctors.</p>
              </div>
              <button
                onClick={() => { setShowUploadForm(!showUploadForm); setDocError(""); }}
                className="rounded-lg bg-primary hover:bg-primary-dark px-3 py-1.5 font-display text-xs font-semibold text-white transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Upload size={12} /> Upload Prescription
              </button>
            </div>

            {/* Upload prescription form */}
            {showUploadForm && (
              <form onSubmit={handleDocUpload} className="bg-bg/40 p-4 border border-border rounded-xl mb-5 flex flex-col gap-3 max-w-lg">
                <h4 className="font-display text-xs font-bold text-ink flex items-center gap-1.5">
                  <Upload size={14} className="text-primary" /> Upload Prescription PDF/Image
                </h4>
                
                {docError && (
                  <div className="p-2 border border-critical/30 bg-critical-light text-critical text-xs rounded-lg font-body">
                    {docError}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-ink">File</label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      const f = e.target.files[0];
                      if (f) {
                        setUploadFile(f);
                        setUploadName(f.name.split(".")[0]);
                      }
                    }}
                    required
                    className="font-body text-xs text-ink"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-ink">Document Name</label>
                    <input
                      type="text"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="e.g. Prescription August"
                      className="rounded-lg border border-border bg-surface px-2.5 py-1.5 font-body text-xs text-ink outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-ink">Link to Appointment</label>
                    <select
                      value={uploadApptId}
                      onChange={(e) => setUploadApptId(e.target.value)}
                      className="rounded-lg border border-border bg-surface px-2.5 py-1.5 font-body text-xs text-ink outline-none cursor-pointer"
                    >
                      <option value="">Do not link</option>
                      {apptRecords.map((apt) => (
                        <option key={apt.id} value={apt.id}>
                          {new Date(apt.scheduledAt).toLocaleDateString()} - {apt.type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-ink">Instructions / Notes</label>
                  <textarea
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="e.g. Fasting sugar is high, adjusting long-acting dosage"
                    rows={2}
                    className="rounded-lg border border-border bg-surface px-2.5 py-1.5 font-body text-xs text-ink outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(false)}
                    className="rounded-lg border border-border px-3 py-1.5 font-semibold text-xs text-muted hover:bg-bg bg-surface cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button type="submit" isLoading={isUploadingDoc} className="px-3 py-1.5 rounded-lg text-xs font-bold">
                    Upload
                  </Button>
                </div>
              </form>
            )}

            {/* Documents Grid */}
            {documents.length === 0 ? (
              <p className="font-body text-xs text-muted py-6">No documents stored on file for this patient.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => {
                  const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");
                  const docUrl = `${BACKEND_URL}${doc.fileUrl}`;
                  const isPrescription = doc.category === "PRESCRIPTION";
                  return (
                    <div key={doc.id} className="rounded-xl border border-border p-3 flex flex-col justify-between gap-3 bg-surface hover:shadow-xs transition-all">
                      <div className="flex gap-2.5 items-start">
                        <div className="p-2 bg-bg rounded-lg border border-border/80 flex-shrink-0">
                          <FileText size={18} className={doc.fileType.includes("pdf") ? "text-red-500" : "text-blue-500"} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${
                            isPrescription 
                              ? "bg-critical-light text-critical border-critical/20" 
                              : "bg-primary-light text-primary border-primary/20"
                          }`}>
                            {doc.category === "LAB_RESULT" ? "Lab Result" : isPrescription ? "Prescription" : "Other"}
                          </span>
                          <h5 className="font-display text-xs font-bold text-ink truncate mt-1" title={doc.fileName}>
                            {doc.fileName}
                          </h5>
                          <p className="text-[9px] text-muted font-body mt-0.5">
                            Uploaded: {new Date(doc.createdAt).toLocaleDateString("en-IN")} by {doc.uploadedBy.toLowerCase()}
                          </p>
                        </div>
                      </div>

                      {doc.notes && (
                        <p className="text-[10px] text-muted italic font-body bg-bg/50 px-2 py-1.5 rounded-lg border border-border/40">
                          "{doc.notes}"
                        </p>
                      )}

                      <div className="flex items-center justify-between border-t border-border/40 pt-2.5 mt-1 text-xs">
                        <span className="text-[9px] text-muted font-semibold flex items-center gap-1">
                          <Calendar size={10} className="text-primary" />
                          {doc.appointment ? `${doc.appointment.type}` : "General File"}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 border border-border bg-surface text-muted hover:text-primary hover:border-primary/30 rounded shadow-3xs"
                            title="View document"
                          >
                            <Eye size={12} />
                          </a>
                          <button
                            onClick={() => handleDocDelete(doc.id)}
                            className="p-1 border border-border bg-surface text-muted hover:text-critical hover:border-critical/30 rounded shadow-3xs cursor-pointer"
                            title="Delete file"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {selectedAptId && (
            <ClinicalRecordModal
              appointmentId={selectedAptId}
              onClose={() => {
                setSelectedAptId(null);
                loadRecords();
              }}
            />
          )}
        </>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, unit, tone }) {
  const toneClass = { success: "text-success", warning: "text-warning", critical: "text-critical" }[tone] || "text-ink";
  return (
    <Card className="p-4">
      <p className="font-body text-xs font-medium text-muted">{label}</p>
      <p className={`numeral mt-1 text-xl font-semibold ${toneClass}`}>
        {value != null ? value : "—"}
        {value != null && <span className="ml-1 text-xs font-normal text-muted">{unit}</span>}
      </p>
    </Card>
  );
}