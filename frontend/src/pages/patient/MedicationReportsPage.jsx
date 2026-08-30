import { useEffect, useState, useRef } from "react";
import { 
  FileText, FolderOpen, Upload, Trash2, Calendar, 
  Check, Loader2, Info, FileCode, Eye, Pill, Plus, Clock, AlertCircle, Sparkles, Trophy, Camera, ChevronRight, Activity
} from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { fetchPatientDocuments, uploadPatientDocument, deletePatientDocument } from "../../api/document.api.js";
import { fetchMyAppointments, fetchMedications, createMedication, logMedicationDose, fetchMedicationAdherence } from "../../api/patient.api.js";
import { fetchMedicalReports, createMedicalReport, deleteMedicalReport } from "../../api/medicalReport.api.js";

const STANDARD_TESTS = [
  { key: "HbA1c", label: "HbA1c", frequencyDays: 90, frequencyLabel: "Once in 3 months" },
  { key: "UACR", label: "UACR", frequencyDays: 365, frequencyLabel: "Once in 12 months" },
  { key: "Thyroid Test", label: "Thyroid test", frequencyDays: 365, frequencyLabel: "Once in 12 months" },
  { key: "Wheat Allergy", label: "Wheat Allergy", frequencyDays: 730, frequencyLabel: "Once in 24 months" },
  { key: "Fasting Lipid Profile Test", label: "Fasting lipid Profile Test", frequencyDays: 365, frequencyLabel: "Once in 12 months" },
  { key: "Fundus Examination", label: "Eye test (Fundus examination)", frequencyDays: 365, frequencyLabel: "Once in 12 months" }
];


const CATEGORIES = [
  { key: "ALL", label: "All Documents" },
  { key: "LAB_RESULT", label: "Lab Results" },
  { key: "PRESCRIPTION", label: "Prescriptions" },
  { key: "OTHER", label: "Other Documents" },
];

export function MedicationReportsPage() {
  const [activeTab, setActiveTab] = useState("medications"); // "medications" | "documents"

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
          {activeTab === "medications" ? (
            <Pill className="text-primary animate-pulse" />
          ) : (
            <FolderOpen className="text-primary animate-pulse" />
          )}
          Medication & Reports
        </h2>
        <p className="font-body text-sm text-muted">
          Manage your scheduled daily medications, log doses for compliance tracking, and store clinical reports or prescriptions.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-bg rounded-xl p-1 border border-border w-fit">
        <button
          onClick={() => setActiveTab("medications")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-display text-xs font-semibold transition-all ${
            activeTab === "medications" ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          <Pill size={14} /> Scheduled Medications
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-display text-xs font-semibold transition-all ${
            activeTab === "documents" ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          <FolderOpen size={14} /> Medical Reports
        </button>
      </div>

      {activeTab === "medications" ? <MedicationsTab /> : <DocumentsTab />}
    </div>
  );
}

// ==========================================
// 1. Medications Tab Component
// ==========================================
function MedicationsTab() {
  const [medications, setMedications] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("Once daily");
  const [timesInput, setTimesInput] = useState("08:00");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [medsList, adhData] = await Promise.all([
        fetchMedications(),
        fetchMedicationAdherence(7)
      ]);
      setMedications(medsList);
      setAdherence(adhData);
    } catch (err) {
      console.error("Failed to load medications:", err);
      setError("Failed to fetch medication list.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!name.trim() || !dose.trim() || !frequency.trim()) {
      setError("Please fill in name, dose, and frequency.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    // Parse scheduled times (split by comma and trim)
    const scheduledTimes = timesInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)); // Basic HH:MM validation

    try {
      await createMedication({
        name,
        dose,
        frequency,
        scheduledTimes,
        purpose: purpose || undefined,
        notes: notes || undefined
      });

      // Clear Form
      setName("");
      setDose("");
      setFrequency("Once daily");
      setTimesInput("08:00");
      setPurpose("");
      setNotes("");
      setShowModal(false);
      setSuccess("Medication added successfully!");
      setTimeout(() => setSuccess(""), 3000);

      // Reload
      await loadData();
    } catch (err) {
      console.error("Create medication error:", err);
      setError(err.response?.data?.message || "Failed to add medication.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogDose = async (medicationId, status) => {
    setError("");
    setSuccess("");
    try {
      await logMedicationDose({ medicationId, status });
      setSuccess(`Dose successfully logged as ${status.toLowerCase()}!`);
      setTimeout(() => setSuccess(""), 3000);
      
      // Reload adherence and logs
      const adhData = await fetchMedicationAdherence(7);
      setAdherence(adhData);
    } catch (err) {
      console.error("Log dose error:", err);
      setError("Failed to record medication dose.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Adherence and Add Button */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {adherence && (
          <Card className="md:col-span-2 flex items-center gap-4 bg-primary-light/10 border-primary/20">
            <div className="p-3 bg-primary-light text-primary rounded-xl">
              <Trophy size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-display text-sm font-bold text-ink">Adherence Rate (Last 7 Days)</h4>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex-1 h-2.5 bg-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${adherence.adherenceRate || 0}%` }}
                  />
                </div>
                <span className="font-display text-sm font-extrabold text-primary">{adherence.adherenceRate || 0}%</span>
              </div>
            </div>
          </Card>
        )}
        <div className="flex md:justify-end">
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 w-full md:w-auto shadow-sm">
            <Plus size={16} /> Add Medication
          </Button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-1.5 p-3 rounded-lg border border-success/30 bg-success-light text-success text-xs font-body shadow-2xs">
          <Check size={14} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 p-3 rounded-lg border border-critical/30 bg-critical-light text-critical text-xs font-body shadow-2xs">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Medications List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 bg-surface border border-border/80 rounded-card">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : medications.length === 0 ? (
        <Card className="text-center py-16 flex flex-col items-center">
          <Pill size={40} className="text-muted/60 mb-2" />
          <h4 className="font-display text-sm font-bold text-ink">No Medications Tracked</h4>
          <p className="font-body text-xs text-muted max-w-xs mt-1 leading-relaxed">
            You don't have any daily scheduled medications active. Tap "Add Medication" above to start logging and tracking compliance.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {medications.map((med) => (
            <Card key={med.id} className="border border-border/80 hover:shadow-md transition-all flex flex-col justify-between p-4.5 gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-primary-light/35 text-primary rounded-xl">
                    <Pill size={20} />
                  </div>
                  <div>
                    <h4 className="font-display text-base font-bold text-ink">{med.name}</h4>
                    <p className="text-xs text-muted mt-0.5">{med.dose} • {med.frequency}</p>
                    {med.purpose && (
                      <p className="text-[10px] bg-bg font-semibold text-muted px-2 py-0.5 rounded border border-border/40 inline-block mt-2">
                        Purpose: {med.purpose}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Timing and Logs info */}
              <div className="bg-bg/40 p-3 rounded-xl border border-border/40 text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2 text-muted font-body">
                  <Clock size={12} className="text-primary flex-shrink-0" />
                  <span>
                    Schedule: {med.scheduledTimes.length > 0 ? med.scheduledTimes.join(", ") : "Not set"}
                  </span>
                </div>
                {med.notes && (
                  <p className="text-muted font-body italic text-[11px] border-t border-border/40 pt-1.5 mt-0.5">
                    "{med.notes}"
                  </p>
                )}
              </div>

              {/* Log dose actions */}
              <div className="flex items-center justify-between border-t border-border/50 pt-3">
                <span className="text-[10px] text-muted uppercase font-bold tracking-wider">
                  Log Dose Today:
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLogDose(med.id, "MISSED")}
                    className="px-2.5 py-1 text-[10px] font-bold border border-critical/30 text-critical bg-critical-light hover:bg-critical hover:text-white rounded-lg transition-colors"
                  >
                    Missed
                  </button>
                  <button
                    onClick={() => handleLogDose(med.id, "TAKEN")}
                    className="px-2.5 py-1 text-[10px] font-bold border border-success/30 text-success bg-success-light hover:bg-success hover:text-white rounded-lg transition-colors"
                  >
                    Taken
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Medication Modal */}
      {showModal && (
        <Modal title="Prescribe / Add Medication" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAddMedication} className="flex flex-col gap-3.5 mt-2">
            <Input
              label="Medication Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Metformin, Lispro, Basalog"
              required
            />
            <Input
              label="Dosage"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="e.g. 500mg, 12 Units"
              required
            />
            <div>
              <label className="mb-1 block font-body text-xs font-semibold text-ink">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3.5 py-2 font-body text-xs text-ink outline-none focus:border-primary shadow-xs transition-colors cursor-pointer"
              >
                <option value="Once daily">Once daily</option>
                <option value="Twice daily">Twice daily</option>
                <option value="Three times daily">Three times daily</option>
                <option value="Before meals">Before meals</option>
                <option value="Bedtime">Bedtime</option>
                <option value="As needed (PRN)">As needed (PRN)</option>
              </select>
            </div>
            <Input
              label="Scheduled Times (24h clock, comma-separated)"
              value={timesInput}
              onChange={(e) => setTimesInput(e.target.value)}
              placeholder="e.g. 08:00, 20:00"
            />
            <Input
              label="Purpose (Optional)"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Blood Sugar Control, Basal Insulin"
            />
            <div>
              <label className="mb-1 block font-body text-xs font-semibold text-ink">Notes / Directions (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Take with dinner, keep refrigerated"
                rows={3}
                className="w-full rounded-lg border border-border bg-bg px-3.5 py-2 font-body text-xs text-ink outline-none focus:border-primary shadow-xs transition-colors resize-none"
              />
            </div>

            <Button type="submit" isLoading={isSaving} className="w-full py-2.5 rounded-xl font-bold flex items-center justify-center mt-2">
              {!isSaving && <Plus size={14} className="mr-1" />}
              {isSaving ? "Adding..." : "Add Medication"}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ==========================================
// 2. Medical Documents Tab Component
// ==========================================
function DocumentsTab() {
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Upload Form State
  const [file, setFile] = useState(null);
  const [customName, setCustomName] = useState("");
  const [testName, setTestName] = useState("HbA1c");
  const [customTestName, setCustomTestName] = useState("");
  const [value, setValue] = useState("");
  const [dateTaken, setDateTaken] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  // Detail/History Modal State
  const [selectedTestHistory, setSelectedTestHistory] = useState(null);

  const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [rptList, apptList] = await Promise.all([
        fetchMedicalReports(),
        fetchMyAppointments()
      ]);
      setReports(rptList);
      setAppointments(apptList);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError("Failed to fetch medical reports.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getTestStatus = (testKey) => {
    const filtered = reports.filter(
      (r) => r.testName.toLowerCase() === testKey.toLowerCase()
    );
    const standard = STANDARD_TESTS.find(
      (t) => t.key.toLowerCase() === testKey.toLowerCase()
    );
    const limit = standard ? standard.frequencyDays : 365;

    if (filtered.length === 0) {
      return { 
        status: "Overdue", 
        text: "Never checked", 
        colorClass: "text-critical bg-critical-light border-critical/20" 
      };
    }

    // Newest first
    const newest = filtered[0];
    const lastDate = new Date(newest.dateTaken);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > limit) {
      return {
        status: "Overdue",
        text: `Overdue (Last: ${lastDate.toLocaleDateString("en-IN")})`,
        colorClass: "text-critical bg-critical-light border-critical/20"
      };
    } else {
      return {
        status: "Up to Date",
        text: `Up to Date (Last: ${lastDate.toLocaleDateString("en-IN")})`,
        colorClass: "text-success bg-success-light border-success/20"
      };
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadSuccess(false);
    setError("");

    const finalTestName = testName === "Other" ? customTestName.trim() : testName;
    if (!finalTestName) {
      setError("Please specify the custom test name.");
      setIsUploading(false);
      return;
    }

    if (!value.trim()) {
      setError("Please specify the test result value.");
      setIsUploading(false);
      return;
    }

    try {
      await createMedicalReport({
        testName: finalTestName,
        value: value.trim(),
        dateTaken,
        notes: notes || undefined,
        file: file || undefined,
      });

      setUploadSuccess(true);
      setFile(null);
      setCustomTestName("");
      setValue("");
      setNotes("");
      
      await loadData();
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || "Failed to log medical report.");
    } finally {
      setIsUploading(false);
    }
  };

  const uniqueTestNames = [
    ...STANDARD_TESTS.map((t) => t.key),
    ...Array.from(
      new Set(
        reports
          .map((r) => r.testName)
          .filter(
            (name) =>
              !STANDARD_TESTS.some(
                (st) => st.key.toLowerCase() === name.toLowerCase()
              )
          )
      )
    ),
  ];

  const reportsByTest = {};
  uniqueTestNames.forEach((name) => {
    reportsByTest[name] = reports
      .filter((r) => r.testName.toLowerCase() === name.toLowerCase())
      .sort((a, b) => new Date(b.dateTaken) - new Date(a.dateTaken));
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 bg-surface border border-border/80 rounded-card">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Target Frequencies Status Banner */}
      <div>
        <h3 className="font-display text-sm font-bold text-ink mb-3 flex items-center gap-1.5">
          <Activity size={16} className="text-primary" /> Target Test Frequencies
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {STANDARD_TESTS.map((test) => {
            const statusInfo = getTestStatus(test.key);
            return (
              <Card key={test.key} className="border flex flex-col justify-between p-4 gap-2 transition-all hover:shadow-xs">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-display text-sm font-bold text-ink truncate" title={test.label}>
                      {test.label}
                    </span>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${statusInfo.colorClass}`}>
                      {statusInfo.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted font-body mt-1">
                    Requirement: <span className="font-semibold text-ink">{test.frequencyLabel}</span>
                  </p>
                </div>
                <div className="text-[10px] font-bold text-muted mt-2 border-t border-border/40 pt-2 flex items-center gap-1">
                  <Clock size={11} />
                  <span>{statusInfo.text}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Grid and Upload Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Reports Comparison Grid */}
        <div className="lg:col-span-8">
          <Card className="border border-border/80 shadow-sm overflow-hidden p-0">
            <div className="p-4 bg-bg border-b border-border/70 flex justify-between items-center">
              <h4 className="font-display text-sm font-bold text-ink flex items-center gap-1.5">
                <FileText size={16} className="text-primary" /> Reports Comparison Grid
              </h4>
              <span className="text-[10px] text-muted font-body">Shows last 3 entries chronologically (newest on left)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg/50 border-b border-border/50 text-[10px] font-bold text-muted uppercase tracking-wider font-body">
                    <th className="p-3 pl-4 min-w-[150px]">Test Type</th>
                    <th className="p-3">Current Status</th>
                    <th className="p-3">1st Entry (Newest)</th>
                    <th className="p-3">2nd Entry</th>
                    <th className="p-3">3rd Entry</th>
                    <th className="p-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-body text-xs text-ink">
                  {uniqueTestNames.map((testKey) => {
                    const isStandard = STANDARD_TESTS.some(t => t.key.toLowerCase() === testKey.toLowerCase());
                    const standardConfig = STANDARD_TESTS.find(t => t.key.toLowerCase() === testKey.toLowerCase());
                    const displayName = standardConfig ? standardConfig.label : testKey;
                    const testList = reportsByTest[testKey] || [];
                    const statusInfo = isStandard ? getTestStatus(testKey) : null;
                    
                    return (
                      <tr key={testKey} className="hover:bg-bg/30 transition-colors">
                        <td className="p-3 pl-4">
                          <div className="font-bold text-ink">{displayName}</div>
                          {isStandard ? (
                            <div className="text-[10px] text-muted">Freq: {standardConfig.frequencyLabel}</div>
                          ) : (
                            <span className="text-[9px] bg-bg border border-border/50 px-1 py-0.5 rounded text-muted font-bold">Custom</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isStandard ? (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${statusInfo.colorClass}`}>
                              {statusInfo.status}
                            </span>
                          ) : (
                            <span className="text-muted text-[10px]">N/A</span>
                          )}
                        </td>
                        {[0, 1, 2].map((index) => {
                          const entry = testList[index];
                          if (!entry) {
                            return (
                              <td key={index} className="p-3 text-muted/50 italic text-[11px]">
                                —
                              </td>
                            );
                          }
                          return (
                            <td key={index} className="p-3">
                              <div className="font-semibold text-primary">{entry.value}</div>
                              <div className="text-[10px] text-muted">
                                {new Date(entry.dateTaken).toLocaleDateString("en-IN", {
                                  day: "numeric", month: "short", year: "numeric"
                                })}
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-3 pr-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedTestHistory({ testName: displayName, reports: testList })}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 border border-border hover:border-primary/30 rounded-lg hover:bg-primary-light text-muted hover:text-primary transition-all ml-auto"
                          >
                            History ({testList.length}) <ChevronRight size={11} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Upload Form Panel */}
        <div className="lg:col-span-4">
          <Card className="border border-border/80 shadow-sm p-4">
            <h3 className="font-display text-sm font-bold text-ink mb-4 flex items-center gap-1.5">
              <Upload size={16} className="text-primary" /> Upload Test Result
            </h3>
            
            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-3.5">
              {/* Test Select */}
              <div>
                <label className="mb-1 block font-body text-xs font-semibold text-ink font-body">Select Test Type</label>
                <select
                  value={testName}
                  onChange={(e) => {
                    setTestName(e.target.value);
                    if (e.target.value !== "Other") {
                      setCustomTestName("");
                    }
                  }}
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2 font-body text-xs text-ink outline-none focus:border-primary shadow-xs transition-colors cursor-pointer"
                >
                  {STANDARD_TESTS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                  <option value="Other">Other (Custom Test)</option>
                </select>
              </div>

              {/* Conditional Custom Name */}
              {testName === "Other" && (
                <Input
                  label="Custom Test Name"
                  value={customTestName}
                  onChange={(e) => setCustomTestName(e.target.value)}
                  placeholder="e.g. Vitamin D Test"
                  required
                />
              )}

              {/* Result Value */}
              <Input
                label="Result Value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 6.5%, 15 mg/g, Normal"
                required
              />

              {/* Date Taken */}
              <div>
                <label className="mb-1 block font-body text-xs font-semibold text-ink font-body">Date Taken</label>
                <input
                  type="date"
                  value={dateTaken}
                  onChange={(e) => setDateTaken(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2 font-body text-xs text-ink outline-none focus:border-primary shadow-xs transition-colors cursor-pointer"
                  required
                />
              </div>

              {/* File Upload Attachment */}
              <div className="flex flex-col gap-1.5 font-body">
                <label className="text-xs font-semibold text-ink">Attach Document (Optional)</label>
                <div className="border border-border bg-bg/50 rounded-lg p-3 text-center relative hover:bg-bg cursor-pointer transition-all">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,image/*"
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                  <Upload size={18} className="text-muted mx-auto mb-1" />
                  <span className="block text-[11px] font-semibold text-ink truncate">
                    {file ? file.name : "Select PDF or Image..."}
                  </span>
                  <span className="text-[9px] text-muted block mt-0.5">PDF, PNG, JPG up to 10MB</span>
                </div>

                <div className="text-center text-[10px] text-muted font-semibold my-1">OR</div>

                <button
                  type="button"
                  onClick={() => setShowCameraModal(true)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-primary-light/10 text-primary py-2 text-xs font-bold hover:bg-primary-light/20 transition-all"
                >
                  <Camera size={14} /> Take Photo with Camera
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block font-body text-xs font-semibold text-ink font-body">Notes / Observations</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Fasting since 10 PM last night"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2 font-body text-xs text-ink outline-none focus:border-primary shadow-xs transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg border border-critical/30 bg-critical-light text-critical text-[10px] font-semibold font-body">
                  <AlertCircle size={12} />
                  <span>{error}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg border border-success/30 bg-success-light text-success text-[10px] font-semibold animate-pulse font-body">
                  <Check size={12} strokeWidth={3} />
                  <span>Report logged successfully!</span>
                </div>
              )}

              <Button type="submit" isLoading={isUploading} className="w-full py-2.5 rounded-xl font-bold flex items-center justify-center">
                {!isUploading && <Upload size={14} className="mr-1" />}
                {isUploading ? "Logging..." : "Log Test Result"}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* 3. Detailed Test History Modal */}
      {selectedTestHistory && (
        <Modal
          title={`${selectedTestHistory.testName} History`}
          onClose={() => setSelectedTestHistory(null)}
        >
          <div className="flex flex-col gap-4 mt-2">
            <p className="text-xs text-muted font-body">
              All logged entries for <span className="font-semibold text-ink">{selectedTestHistory.testName}</span> (Total: {selectedTestHistory.reports.length})
            </p>
            {selectedTestHistory.reports.length === 0 ? (
              <p className="text-center py-6 text-xs text-muted font-body">No history entries found.</p>
            ) : (
              <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                {selectedTestHistory.reports.map((report) => {
                  const downloadUrl = report.fileUrl ? `${BACKEND_URL}${report.fileUrl}` : null;
                  return (
                    <div
                      key={report.id}
                      className="border border-border/70 bg-bg/25 rounded-xl p-3.5 flex flex-col gap-2 relative hover:bg-bg/50 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="font-display text-sm font-bold text-ink">{report.value}</div>
                          <div className="text-[10px] text-muted font-body mt-0.5">
                            Date Taken: {new Date(report.dateTaken).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("Are you sure you want to delete this test record?")) return;
                            try {
                              await deleteMedicalReport(report.id);
                              const updatedReports = selectedTestHistory.reports.filter(r => r.id !== report.id);
                              setSelectedTestHistory({ ...selectedTestHistory, reports: updatedReports });
                              await loadData();
                            } catch (err) {
                              console.error("Delete report error:", err);
                              alert("Failed to delete report entry.");
                            }
                          }}
                          className="p-1 border border-border bg-surface text-muted hover:text-critical hover:border-critical/30 rounded-lg shadow-2xs hover:bg-critical-light transition-all"
                          title="Delete entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {(report.notes || downloadUrl) && (
                        <div className="border-t border-border/50 pt-2 mt-1 flex flex-col gap-1.5 text-xs font-body">
                          {report.notes && (
                            <p className="text-muted italic text-[11px]">
                              "{report.notes}"
                            </p>
                          )}
                          {downloadUrl && (
                            <a
                              href={downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 w-fit rounded-lg border border-primary/20 bg-primary-light/10 text-primary py-1 px-2.5 text-[10px] font-bold hover:bg-primary-light/20 transition-all mt-1"
                            >
                              <FileText size={11} /> View Attachment
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end mt-2">
              <Button onClick={() => setSelectedTestHistory(null)} className="w-full sm:w-auto py-2 px-5">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showCameraModal && (
        <CameraCaptureModal
          onCapture={(capturedFile) => {
            setFile(capturedFile);
            setShowCameraModal(false);
          }}
          onClose={() => setShowCameraModal(false)}
        />
      )}
    </div>
  );
}


// Camera Capture Modal
function CameraCaptureModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let activeStream = null;
    navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } 
    })
    .then((mediaStream) => {
      activeStream = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsLoading(false);
    })
    .catch((err) => {
      console.error("Camera access error:", err);
      setCameraError("Could not access camera. Please check permissions.");
      setIsLoading(false);
    });

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera_capture_${Date.now()}.png`, { type: "image/png" });
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }
          onCapture(file);
        }
      }, "image/png");
    }
  };

  return (
    <Modal title="Take Document Photo" onClose={onClose}>
      <div className="flex flex-col gap-4 items-center">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="animate-spin text-primary mb-2" size={24} />
            <span className="text-xs text-muted font-semibold">Starting camera feed...</span>
          </div>
        )}

        {cameraError && (
          <div className="flex items-center gap-1.5 p-3 rounded-lg border border-critical/30 bg-critical-light text-critical text-xs text-center w-full">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {!cameraError && (
          <div className="relative w-full aspect-video rounded-xl bg-black overflow-hidden border border-border">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        <div className="flex gap-2 w-full mt-2">
          <Button 
            type="button" 
            onClick={onClose} 
            className="flex-1 bg-surface text-ink hover:bg-bg border border-border"
          >
            Cancel
          </Button>
          {!cameraError && !isLoading && (
            <Button 
              type="button" 
              onClick={handleCapture} 
              className="flex-1"
            >
              Capture Photo
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
