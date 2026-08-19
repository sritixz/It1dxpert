import { useEffect, useState } from "react";
import { 
  FileText, FolderOpen, Upload, Trash2, Calendar, 
  Check, Loader2, Info, FileCode, Eye, Pill, Plus, Clock, AlertCircle, Sparkles, Trophy
} from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { fetchPatientDocuments, uploadPatientDocument, deletePatientDocument } from "../../api/document.api.js";
import { fetchMyAppointments, fetchMedications, createMedication, logMedicationDose, fetchMedicationAdherence } from "../../api/patient.api.js";

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
  const [documents, setDocuments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Upload Form State
  const [file, setFile] = useState(null);
  const [customName, setCustomName] = useState("");
  const [category, setCategory] = useState("LAB_RESULT");
  const [notes, setNotes] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [docs, appts] = await Promise.all([
        fetchPatientDocuments(),
        fetchMyAppointments()
      ]);
      setDocuments(docs);
      setAppointments(appts);
    } catch (err) {
      console.error("Failed to load documents:", err);
      setError("Failed to fetch medical documents.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setCustomName(selectedFile.name.split(".")[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    setIsUploading(true);
    setUploadSuccess(false);
    setError("");

    try {
      await uploadPatientDocument({
        file,
        category,
        notes,
        appointmentId: appointmentId || undefined,
        customName: customName || undefined
      });
      setUploadSuccess(true);
      setFile(null);
      setCustomName("");
      setNotes("");
      setAppointmentId("");
      
      // Reload list
      const docs = await fetchPatientDocuments();
      setDocuments(docs);

      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm("Are you sure you want to permanently delete this document?")) return;
    try {
      await deletePatientDocument(docId);
      setDocuments(documents.filter((d) => d.id !== docId));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete document.");
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (activeFilter === "ALL") return true;
    return doc.category === activeFilter;
  });

  const getCategoryBadgeColor = (cat) => {
    switch (cat) {
      case "LAB_RESULT":
        return "bg-primary-light text-primary border-primary/20";
      case "PRESCRIPTION":
        return "bg-critical-light text-critical border-critical/20";
      default:
        return "bg-warning-light text-warning border-warning/20";
    }
  };

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case "LAB_RESULT": return "Lab Result";
      case "PRESCRIPTION": return "Prescription";
      default: return "Other File";
    }
  };

  const getFileIcon = (mime) => {
    if (mime.includes("pdf")) return <FileText size={28} className="text-red-500" />;
    return <FileCode size={28} className="text-blue-500" />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Upload Form */}
      <Card className="lg:col-span-4 border-border/80 shadow-sm">
        <h3 className="font-display text-sm font-bold text-ink mb-4 flex items-center gap-1.5">
          <Upload size={16} className="text-primary" /> Upload New File
        </h3>
        
        <form onSubmit={handleUploadSubmit} className="flex flex-col gap-3.5">
          {/* File Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink">Choose PDF or Image</label>
            <div className="border border-border bg-bg/50 rounded-lg p-3 text-center relative hover:bg-bg cursor-pointer transition-all">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,image/*"
                required
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
              <Upload size={18} className="text-muted mx-auto mb-1" />
              <span className="block text-[11px] font-semibold text-ink truncate">
                {file ? file.name : "Select file..."}
              </span>
              <span className="text-[9px] text-muted block mt-0.5">PDF, PNG, JPG up to 10MB</span>
            </div>
          </div>

          <Input
            label="Document Name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Blood Test Report July"
            required
          />

          <div>
            <label className="mb-1 block font-body text-xs font-semibold text-ink">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3.5 py-2 font-body text-xs text-ink outline-none focus:border-primary shadow-xs transition-colors cursor-pointer"
            >
              <option value="LAB_RESULT">Lab Result (Urine/Blood)</option>
              <option value="PRESCRIPTION">Prescription</option>
              <option value="OTHER">Other Documents</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-body text-xs font-semibold text-ink">Link to Appointment (Optional)</label>
            <select
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3.5 py-2 font-body text-xs text-ink outline-none focus:border-primary shadow-xs transition-colors cursor-pointer"
            >
              <option value="">Do not link to appointment</option>
              {appointments.map((appt) => (
                <option key={appt.id} value={appt.id}>
                  {new Date(appt.scheduledAt).toLocaleDateString()} - {appt.type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-body text-xs font-semibold text-ink">Notes / Observations</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Fasting sugar was 110, urine ketones negative"
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
              <span>Uploaded successfully!</span>
            </div>
          )}

          <Button type="submit" isLoading={isUploading} className="w-full py-2.5 rounded-xl font-bold flex items-center justify-center">
            {!isUploading && <Upload size={14} className="mr-1" />}
            {isUploading ? "Uploading..." : "Upload File"}
          </Button>
        </form>
      </Card>

      {/* Right Column: Files Grid */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        {/* Filters Bar */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveFilter(cat.key)}
              className={`rounded-lg border px-3 py-1.5 font-body text-xs font-semibold transition-all ${
                activeFilter === cat.key
                  ? "border-primary bg-primary-light text-primary shadow-xs"
                  : "border-border bg-surface text-muted hover:bg-bg hover:text-ink"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Documents Stream */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20 bg-surface border border-border/80 rounded-card">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-border/80 rounded-card p-6 flex flex-col items-center">
            <FolderOpen size={40} className="text-muted/60 mb-2" />
            <h4 className="font-display text-sm font-bold text-ink">No Documents Found</h4>
            <p className="font-body text-xs text-muted max-w-xs mt-1 leading-relaxed">
              You have not uploaded any files in this category. Use the upload panel on the left to add test reports or documents.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredDocs.map((doc) => {
              const docDownloadUrl = `${BACKEND_URL}${doc.fileUrl}`;
              return (
                <Card key={doc.id} className="border-border/80 hover:shadow-md transition-all flex flex-col justify-between p-4.5 gap-4">
                  <div className="flex gap-3 items-start">
                    <div className="p-2.5 bg-bg rounded-xl border border-border/70 flex-shrink-0">
                      {getFileIcon(doc.fileType)}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getCategoryBadgeColor(doc.category)}`}>
                        {getCategoryLabel(doc.category)}
                      </span>
                      
                      <h4 className="font-display text-sm font-bold text-ink truncate mt-1.5" title={doc.fileName}>
                        {doc.fileName}
                      </h4>
                      
                      <p className="text-[10px] text-muted font-body mt-1">
                        Uploaded: {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </p>
                    </div>
                  </div>

                  {(doc.appointment || doc.notes) && (
                    <div className="flex flex-col gap-1.5 bg-bg/40 p-2.5 rounded-xl border border-border/40 text-xs">
                      {doc.appointment && (
                        <div className="flex items-center gap-1.5 text-muted font-body">
                          <Calendar size={12} className="text-primary flex-shrink-0" />
                          <span className="truncate">
                            Visit: <strong>{doc.appointment.type}</strong> on {new Date(doc.appointment.scheduledAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {doc.notes && (
                        <div className="text-muted leading-relaxed font-body italic border-t border-border/40 pt-1.5 mt-1 text-[11px]">
                          "{doc.notes}"
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="text-[10px] text-muted uppercase font-bold tracking-wider">
                      {doc.uploadedBy === "DOCTOR" ? "Uploaded by Doctor" : "Self Upload"}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <a
                        href={docDownloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 border border-border bg-surface text-muted hover:text-primary hover:border-primary/30 rounded-lg shadow-2xs hover:bg-primary-light transition-all"
                        title="View / Download"
                      >
                        <Eye size={13} />
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 border border-border bg-surface text-muted hover:text-critical hover:border-critical/30 rounded-lg shadow-2xs hover:bg-critical-light transition-all"
                        title="Delete file"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
