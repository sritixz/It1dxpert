import { useState, useEffect } from "react";
import { 
  Droplet, Syringe, UtensilsCrossed, Footprints, Flame, Award, 
  Plus, Check, X, Loader2, ChevronRight, AlertCircle, Sparkles, Upload, Calendar, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../components/ui/Card.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { 
  fetchDailyLog, 
  logGlucose, 
  logMeal, 
  logInsulin, 
  logActivity,
  fetchGamificationStatus,
  fetchPatient7DayReport
} from "../../api/patient.api.js";
import { extractLogsFromDocument } from "../../api/ai.api.js";
import { exportReportToPdf } from "../../utils/pdfExport.js";

export function PatientDashboardPlaceholder() {
  const { user } = useAuth();
  const [dailyLog, setDailyLog] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Quick Log Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeLogType, setActiveLogType] = useState("glucose"); // 'glucose' | 'insulin' | 'meal' | 'activity' | 'ai-scan'
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // AI Document Scanner States
  const [aiFile, setAiFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedLogs, setScannedLogs] = useState([]);
  const [isManualGrid, setIsManualGrid] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Could not open report window. Please allow popups for this website.");
      return;
    }
    setIsExporting(true);
    try {
      const data = await fetchPatient7DayReport();
      exportReportToPdf(data, printWindow);
    } catch (err) {
      printWindow.close();
      console.error("Failed to export PDF:", err);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Form states
  const [glucoseValue, setGlucoseValue] = useState("");
  const [glucoseContext, setGlucoseContext] = useState("Pre-Meal");

  const [carbValue, setCarbValue] = useState("");
  const [mealType, setMealType] = useState("Breakfast");
  const [mealNotes, setMealNotes] = useState("");

  const [insulinUnits, setInsulinUnits] = useState("");
  const [insulinType, setInsulinType] = useState("Lispro (Meal Time)");
  const [customInsulinType, setCustomInsulinType] = useState("");
  const [insulinReason, setInsulinReason] = useState("Meal Bolus");

  const [activityMins, setActivityMins] = useState("");
  const [activityType, setActivityType] = useState("Walking");

  const getTodayDateStr = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().slice(0, 10);
  };

  const getTodayTimeStr = () => {
    const d = new Date();
    const hrs = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${hrs}:${mins}`;
  };

  const [logDate, setLogDate] = useState(getTodayDateStr());
  const [logTimeMode, setLogTimeMode] = useState("current"); // 'current' | 'custom'
  const [customLogTime, setCustomLogTime] = useState(getTodayTimeStr());

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const todayStr = getTodayDateStr();
      const [logRes, gamRes] = await Promise.all([
        fetchDailyLog(todayStr),
        fetchGamificationStatus()
      ]);
      setDailyLog(logRes);
      setGamification(gamRes);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to load today's dashboard metrics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openLogModal = (type) => {
    setActiveLogType(type);
    setLogDate(getTodayDateStr());
    setLogTimeMode("current");
    setCustomLogTime(getTodayTimeStr());
    setSubmitError("");
    setSubmitSuccess("");
    setIsModalOpen(true);
  };

  const closeLogModal = () => {
    setIsModalOpen(false);
    // Reset values
    setGlucoseValue("");
    setCarbValue("");
    setMealNotes("");
    setInsulinUnits("");
    setActivityMins("");
    setLogDate(getTodayDateStr());
    setLogTimeMode("current");
    setCustomLogTime(getTodayTimeStr());

    // Reset AI Scanner values
    setAiFile(null);
    setIsScanning(false);
    setScannedLogs([]);
    setIsManualGrid(false);
    setCustomInsulinType("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      let finalDate;
      const [yr, mo, dy] = logDate.split("-").map(Number);
      if (logTimeMode === "current") {
        const d = new Date();
        finalDate = new Date(yr, mo - 1, dy, d.getHours(), d.getMinutes(), d.getSeconds());
      } else {
        const [hrs, mins] = customLogTime.split(":").map(Number);
        finalDate = new Date(yr, mo - 1, dy, hrs, mins, 0);
      }
      const loggedAt = finalDate.toISOString();

      if (activeLogType === "glucose") {
        const val = parseFloat(glucoseValue);
        if (isNaN(val) || val <= 0) throw new Error("Glucose value must be a positive number.");
        await logGlucose({ value: val, context: glucoseContext, loggedAt });
      } else if (activeLogType === "meal") {
        const carbs = parseFloat(carbValue);
        if (isNaN(carbs) || carbs < 0) throw new Error("Carb intake must be a positive number.");
        await logMeal({ carbs, mealType, notes: mealNotes || undefined, loggedAt });
      } else if (activeLogType === "insulin") {
        const units = parseFloat(insulinUnits);
        if (isNaN(units) || units <= 0) throw new Error("Insulin units must be a positive number.");
        const finalInsulinType = (insulinType === "Other Metals" || insulinType === "Other Meds")
          ? customInsulinType.trim() || insulinType
          : insulinType;
        await logInsulin({ units, insulinType: finalInsulinType, reason: insulinReason, loggedAt });
      } else if (activeLogType === "activity") {
        const duration = parseInt(activityMins);
        if (isNaN(duration) || duration <= 0) throw new Error("Activity duration must be a positive integer.");
        await logActivity({ durationMins: duration, activityType, loggedAt });
      }

      setSubmitSuccess("Logged successfully!");
      setTimeout(() => {
        closeLogModal();
        loadData();
      }, 1000);
    } catch (err) {
      console.error("Error logging entry:", err);
      setSubmitError(err.message || err.response?.data?.message || "Failed to log entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiUploadChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAiFile(file);
    setIsScanning(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const data = await extractLogsFromDocument(file);
      if (data && data.extractedLogs && data.extractedLogs.length > 0) {
        const logsWithSelection = data.extractedLogs.map(log => ({
          ...log,
          selected: true
        }));
        setScannedLogs(logsWithSelection);
      } else {
        setScannedLogs([]);
        setSubmitError("We couldn't identify any logs in the document. Try a clearer image or use the manual grid.");
        setIsManualGrid(true);
      }
    } catch (err) {
      console.error("AI log extraction failed:", err);
      setSubmitError(err.response?.data?.message || "AI failed to scan this document. Try manual grid logging.");
      setIsManualGrid(true);
      setScannedLogs([
        {
          type: "glucose",
          value: 120,
          context: "Pre-Meal",
          selected: true,
          loggedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveExtractedLogs = async () => {
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    const logsToSave = scannedLogs.filter(log => log.selected);
    try {
      for (const log of logsToSave) {
        if (log.type === "glucose") {
          await logGlucose({
            value: log.value,
            context: log.context || "Other",
            loggedAt: log.loggedAt || undefined
          });
        } else if (log.type === "insulin") {
          const finalType = (log.insulinType === "Other Metals" || log.insulinType === "Other Meds")
            ? (log.customInsulinType?.trim() || log.insulinType)
            : (log.insulinType || "Glargine (Long Acting)");
          await logInsulin({
            units: log.value,
            insulinType: finalType,
            reason: log.reason || "Meal Bolus",
            loggedAt: log.loggedAt || undefined
          });
        } else if (log.type === "meal") {
          await logMeal({
            carbs: log.value,
            mealType: log.mealType || "Breakfast",
            notes: log.notes || undefined,
            loggedAt: log.loggedAt || undefined
          });
        }
      }

      setSubmitSuccess(`Logged ${logsToSave.length} items successfully!`);
      setTimeout(() => {
        closeLogModal();
        loadData();
      }, 1500);
    } catch (err) {
      console.error("Failed to save AI extracted logs:", err);
      setSubmitError(err.response?.data?.message || err.message || "Failed to save logs to diary.");
    } finally {
      setSubmitting(false);
    }
  };

  // Compute log completion checklist
  const hasGlucose = dailyLog?.glucose?.length >= 4;
  const hasInsulin = dailyLog?.insulin?.length >= 4;
  const hasMeals = dailyLog?.meals?.length >= 4;
  const hasActivity = dailyLog?.activity?.length >= 4;

  const checklist = [
    { id: "glucose", name: "Glucose Reading", status: hasGlucose, count: dailyLog?.glucose?.length || 0, icon: Droplet, color: "text-primary bg-primary-light" },
    { id: "insulin", name: "Insulin Administered", status: hasInsulin, count: dailyLog?.insulin?.length || 0, icon: Syringe, color: "text-critical bg-critical-light" },
    { id: "meal", name: "Meal / Carbohydrates", status: hasMeals, count: dailyLog?.meals?.length || 0, icon: UtensilsCrossed, color: "text-warning bg-warning-light" },
    { id: "activity", name: "Physical Activity", status: hasActivity, count: dailyLog?.activity?.length || 0, icon: Footprints, color: "text-success bg-success-light" }
  ];

  const totalLogs = Math.min(4, dailyLog?.glucose?.length || 0) +
                    Math.min(4, dailyLog?.insulin?.length || 0) +
                    Math.min(4, dailyLog?.meals?.length || 0) +
                    Math.min(4, dailyLog?.activity?.length || 0);

  const progressPercent = Math.round((totalLogs / 16) * 100);
  const loggedCount = checklist.filter((item) => item.status).length;

  // Format today's display date
  const displayDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  });

  // Latest glucose helper
  const latestGlucose = dailyLog?.glucose?.length > 0 
    ? dailyLog.glucose[dailyLog.glucose.length - 1]
    : null;

  // Status colors helper for glucose
  const getGlucoseStatusStyles = (val) => {
    if (!val) return { color: "text-muted", bg: "bg-surface" };
    if (val <= 54 || val >= 250) return { color: "text-critical", bg: "bg-critical-light" };
    if (val < 70) return { color: "text-warning", bg: "bg-warning-light" };
    if (val > 180) return { color: "text-critical", bg: "bg-critical-light" };
    return { color: "text-success", bg: "bg-success-light" };
  };

  const glucoseStyles = getGlucoseStatusStyles(latestGlucose?.value);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header Greeting & Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">
            Welcome back{user?.patientProfile?.fullName ? `, ${user.patientProfile.fullName.split(" ")[0]}` : ""} 👋
          </h2>
          <p className="font-body text-sm text-muted">
            Here's your summary for <span className="font-semibold text-ink">{displayDateStr}</span>
          </p>
          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2 mt-2 font-body text-xs text-muted">
            <span className="px-2.5 py-1 rounded-lg bg-surface border border-border/80 shadow-xs">
              Patient: <strong className="text-ink">{user?.patientProfile?.fullName}</strong>
            </span>
            {user?.patientProfile?.assignedDoctor && (
              <span className="px-2.5 py-1 rounded-lg bg-surface border border-border/80 shadow-xs">
                Doctor: <strong className="text-ink">Dr. {user.patientProfile.assignedDoctor.fullName}</strong> 
                {user.patientProfile.assignedDoctor.specialization && ` (${user.patientProfile.assignedDoctor.specialization})`}
              </span>
            )}
            {user?.patientProfile?.hospital && (
              <span className="px-2.5 py-1 rounded-lg bg-surface border border-border/80 shadow-xs">
                Hospital: <strong className="text-ink">{user.patientProfile.hospital.name}</strong>
              </span>
            )}
          </div>
        </div>
        
        {/* Quick Log Buttons */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => openLogModal("glucose")} 
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-light text-primary hover:bg-primary hover:text-white font-body text-xs font-semibold transition-all shadow-sm"
          >
            <Plus size={14} /> Log Glucose
          </button>
          <button 
            onClick={() => openLogModal("insulin")} 
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-critical-light text-critical hover:bg-critical hover:text-white font-body text-xs font-semibold transition-all shadow-sm"
          >
            <Plus size={14} /> Log Insulin
          </button>
          <button 
            onClick={() => openLogModal("meal")} 
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-warning-light text-warning hover:bg-warning hover:text-white font-body text-xs font-semibold transition-all shadow-sm"
          >
            <Plus size={14} /> Log Meals
          </button>
          <button 
            onClick={() => openLogModal("activity")} 
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success-light text-success hover:bg-success hover:text-white font-body text-xs font-semibold transition-all shadow-sm animate-fade-in"
          >
            <Plus size={14} /> Log Activity
          </button>
          <button 
            onClick={() => openLogModal("ai-scan")} 
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white font-body text-xs font-semibold transition-all shadow-sm border border-indigo-100/50 cursor-pointer"
          >
            <Sparkles size={14} className="animate-pulse" /> AI Document Scan
          </button>
          <button 
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white font-body text-xs font-semibold transition-all shadow-sm border border-teal-100/50 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileText size={14} />
            )}
            {isExporting ? "Generating..." : "Export 7-Day PDF"}
          </button>
        </div>
      </div>

      {error && (
        <Card className="border-critical/30 bg-critical-light">
          <div className="flex items-center gap-2 text-critical">
            <AlertCircle size={16} />
            <p className="font-body text-sm">{error}</p>
          </div>
        </Card>
      )}

      {isLoading && !dailyLog ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* 2. Top-Section Grid: Daily Progress & Streaks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Logging Progress Bar Card */}
            <Card className="lg:col-span-2 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display text-base font-bold text-ink">Daily Logging Progress</h3>
                    <p className="text-xs text-muted mt-0.5">Log all four metrics today to maintain high data quality.</p>
                  </div>
                  {progressPercent === 100 && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-success-light text-success font-body text-xs font-bold shadow-sm border border-success/20 animate-pulse">
                      <Sparkles size={12} /> Day Complete!
                    </span>
                  )}
                </div>

                {/* Progress Bar Display */}
                <div className="mt-6">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="font-display text-3xl font-extrabold text-ink">
                      {progressPercent}%
                    </span>
                    <span className="font-body text-xs text-muted font-semibold">
                      {loggedCount} of 4 logged
                    </span>
                  </div>
                  
                  {/* Progress track */}
                  <div className="h-3 w-full bg-bg rounded-full overflow-hidden border border-border">
                    <motion.div 
                      className={`h-full rounded-full ${
                        progressPercent === 100 
                          ? "bg-gradient-to-r from-success to-emerald-400" 
                          : progressPercent >= 50
                          ? "bg-gradient-to-r from-primary to-blue-400"
                          : "bg-gradient-to-r from-warning to-amber-300"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>

              {/* Progress Checklist Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 border-t border-border/60 pt-4">
                {checklist.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={item.id}
                      onClick={() => !item.status && openLogModal(item.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                        item.status 
                          ? "bg-surface border-success/30 shadow-sm" 
                          : "bg-bg/40 border-border/50 hover:bg-bg hover:border-border hover:shadow-xs"
                      }`}
                    >
                      <div className={`p-2 rounded-lg mb-1.5 ${item.color}`}>
                        <Icon size={16} />
                      </div>
                      <span className="font-body text-[11px] font-semibold text-ink text-center">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-muted font-medium mt-0.5">
                        {item.count} / 4 logged
                      </span>
                      <div className="mt-2 flex items-center justify-center">
                        {item.status ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-white">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full border border-border text-[9px] font-bold text-muted bg-surface">
                            <Plus size={8} /> Log
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Streak & Gamification Summary Card */}
            <Card className="flex flex-col justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-ink">Streak & Achievements</h3>
                <p className="text-xs text-muted mt-0.5">Your consistency record rewards</p>
                
                {/* Flame display */}
                <div className="flex items-center gap-4 mt-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 shadow-inner">
                    <Flame size={32} className="fill-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Current Streak</p>
                    <p className="numeral text-3xl font-extrabold text-ink">
                      {gamification?.streak?.currentStreak || 0} <span className="text-sm font-semibold text-muted">days</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-body border-t border-border/60 pt-3">
                  <span className="text-muted">Longest Streak:</span>
                  <span className="font-bold text-ink">{gamification?.streak?.longestStreak || 0} days</span>
                </div>
              </div>

              {/* Mini Badges List */}
              <div className="mt-6">
                <p className="text-xs font-bold text-ink mb-2">Earned Badges ({gamification?.badges?.length || 0})</p>
                {gamification?.badges?.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                    {gamification.badges.slice(0, 3).map((item) => (
                      <div 
                        key={item.badge.code} 
                        className="flex flex-col items-center p-2 rounded-lg bg-bg border border-border/80 min-w-[70px] text-center"
                        title={item.badge.description}
                      >
                        <Award size={18} className="text-primary mb-1" />
                        <span className="text-[9px] font-bold text-ink leading-tight truncate w-14">
                          {item.badge.name}
                        </span>
                      </div>
                    ))}
                    {gamification.badges.length > 3 && (
                      <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-bg border border-dashed border-border min-w-[50px] text-center">
                        <span className="text-[10px] font-bold text-muted">
                          +{gamification.badges.length - 3} more
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted italic">Complete your daily logs to earn badges.</p>
                )}
              </div>
            </Card>

          </div>

          {/* 3. Daily Metrics Card Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Glucose Card */}
            <Card className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted">Glucose (Latest)</p>
                  <p className="numeral mt-1 text-2xl font-bold text-ink">
                    {latestGlucose ? `${latestGlucose.value} ` : "—"}
                    {latestGlucose && <span className="text-xs font-normal text-muted">mg/dL</span>}
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg ${glucoseStyles.bg} ${glucoseStyles.color}`}>
                  <Droplet size={18} />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-border/40 flex justify-between items-center text-xs">
                <span className="text-muted">
                  {latestGlucose ? latestGlucose.context : "No records today"}
                </span>
                {latestGlucose && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    latestGlucose.value >= 70 && latestGlucose.value <= 180
                      ? "bg-success-light text-success"
                      : "bg-critical-light text-critical"
                  }`}>
                    {latestGlucose.value >= 70 && latestGlucose.value <= 180 ? "In Range" : "Out of Range"}
                  </span>
                )}
              </div>
            </Card>

            {/* Carbs Card */}
            <Card className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted">Carbs (Today)</p>
                  <p className="numeral mt-1 text-2xl font-bold text-ink">
                    {dailyLog?.summary?.totalCarbs || 0} <span className="text-xs font-normal text-muted">g</span>
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-warning-light text-warning">
                  <UtensilsCrossed size={18} />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-border/40 text-xs text-muted">
                {dailyLog?.meals?.length || 0} meals recorded
              </div>
            </Card>

            {/* Insulin Card */}
            <Card className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted">Insulin (Today)</p>
                  <p className="numeral mt-1 text-2xl font-bold text-ink">
                    {dailyLog?.summary?.totalInsulin || 0} <span className="text-xs font-normal text-muted">u</span>
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-critical-light text-critical">
                  <Syringe size={18} />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-border/40 text-xs text-muted">
                {dailyLog?.insulin?.length || 0} doses logged
              </div>
            </Card>

            {/* Activity Card */}
            <Card className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted">Activity (Today)</p>
                  <p className="numeral mt-1 text-2xl font-bold text-ink">
                    {dailyLog?.summary?.totalActivityMins || 0} <span className="text-xs font-normal text-muted">min</span>
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-success-light text-success">
                  <Footprints size={18} />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-border/40 text-xs text-muted">
                {dailyLog?.activity?.length || 0} sessions logged
              </div>
            </Card>

          </div>
        </>
      )}

      {/* 4. Quick Log Modal overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`bg-surface rounded-card shadow-lg border border-border w-full transition-all duration-300 overflow-hidden ${
                activeLogType === "ai-scan" ? "max-w-3xl" : "max-w-md"
              }`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-bg">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    activeLogType === "glucose" ? "bg-primary-light text-primary" :
                    activeLogType === "insulin" ? "bg-critical-light text-critical" :
                    activeLogType === "meal" ? "bg-warning-light text-warning" : 
                    activeLogType === "ai-scan" ? "bg-indigo-50 text-indigo-600" : "bg-success-light text-success"
                  }`}>
                    {activeLogType === "glucose" && <Droplet size={16} />}
                    {activeLogType === "insulin" && <Syringe size={16} />}
                    {activeLogType === "meal" && <UtensilsCrossed size={16} />}
                    {activeLogType === "activity" && <Footprints size={16} />}
                    {activeLogType === "ai-scan" && <Sparkles size={16} className="animate-pulse" />}
                  </div>
                  <h3 className="font-display text-sm font-bold text-ink capitalize">
                    {activeLogType === "ai-scan" ? "AI Smart Log Scan" : `Log ${activeLogType === "meal" ? "Meals/Carbs" : activeLogType}`}
                  </h3>
                </div>
                <button 
                  onClick={closeLogModal}
                  className="p-1 rounded-lg text-muted hover:bg-bg hover:text-ink transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
              {/* Standard Forms */}
              {activeLogType !== "ai-scan" ? (
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  {/* Error Banner */}
                  {submitError && (
                    <div className="flex items-center gap-1.5 p-2.5 rounded-lg border border-critical/30 bg-critical-light text-critical text-xs">
                      <AlertCircle size={14} />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Success Banner */}
                  {submitSuccess && (
                    <div className="flex items-center gap-1.5 p-2.5 rounded-lg border border-success/30 bg-success-light text-success text-xs">
                      <Check size={14} strokeWidth={3} />
                      <span>{submitSuccess}</span>
                    </div>
                  )}

                  {/* --- Glucose Form Fields --- */}
                  {activeLogType === "glucose" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">
                          Glucose Level (mg/dL)
                        </label>
                        <input
                          type="number"
                          required
                          value={glucoseValue}
                          onChange={(e) => setGlucoseValue(e.target.value)}
                          placeholder="e.g. 120"
                          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary text-ink"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">
                          Context/Timing
                        </label>
                        <select
                          value={glucoseContext}
                          onChange={(e) => setGlucoseContext(e.target.value)}
                          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary text-ink"
                        >
                          <option value="Pre-Meal">Pre-Meal</option>
                          <option value="Post-Meal">Post-Meal</option>
                          <option value="Fasting">Fasting</option>
                          <option value="Bedtime">Bedtime</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* --- Insulin Form Fields --- */}
                  {activeLogType === "insulin" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">
                          Dose (units)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          required
                          value={insulinUnits}
                          onChange={(e) => setInsulinUnits(e.target.value)}
                          placeholder="e.g. 6.5"
                          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary text-ink"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">
                          Insulin Type
                        </label>
                        <select
                          value={insulinType}
                          onChange={(e) => setInsulinType(e.target.value)}
                          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary text-ink"
                        >
                          <option value="Lispro (Meal Time)">Lispro (Meal Time)</option>
                          <option value="Glargine (Long Acting)">Glargine (Long Acting)</option>
                          <option value="Aspart (Rapid)">Aspart (Rapid)</option>
                          <option value="Detemir (Basal)">Detemir (Basal)</option>
                          <option value="Other Metals">Other Metals</option>
                          <option value="Other Meds">Other Meds</option>
                        </select>
                      </div>
                      {(insulinType === "Other Metals" || insulinType === "Other Meds") && (
                        <div>
                          <label className="block text-xs font-semibold text-ink mb-1">
                            Custom Medicine Name
                          </label>
                          <input
                            type="text"
                            required
                            value={customInsulinType}
                            onChange={(e) => setCustomInsulinType(e.target.value)}
                            placeholder="e.g. Gold Bhasma, Metformin"
                            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary text-ink"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">
                          Reason
                        </label>
                        <select
                          value={insulinReason}
                          onChange={(e) => setInsulinReason(e.target.value)}
                          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary text-ink"
                        >
                          <option value="Meal Bolus">Meal Bolus</option>
                          <option value="Correction">Correction</option>
                          <option value="Basal Dose">Basal Dose</option>
                          <option value="Snack Bolus">Snack Bolus</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* --- Meal Form Fields --- */}
                  {activeLogType === "meal" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">
                          Carbohydrates (grams)
                        </label>
                        <input
                          type="number"
                          required
                          value={carbValue}
                          onChange={(e) => setCarbValue(e.target.value)}
                          placeholder="e.g. 45"
                          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary text-ink"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">
                          Meal Type
                        </label>
                        <select
                          value={mealType}
                          onChange={(e) => setMealType(e.target.value)}
                          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary text-ink"
                        >
                          <option value="Breakfast">Breakfast</option>
                          <option value="Lunch">Lunch</option>
                          <option value="Dinner">Dinner</option>
                          <option value="Snack">Snack</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">
                          Notes / Food Description
                        </label>
                        <input
                          type="text"
                          value={mealNotes}
                          onChange={(e) => setMealNotes(e.target.value)}
                          placeholder="e.g. Chicken wrap & apple"
                          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary text-ink"
                        />
                      </div>
                    </div>
                  )}

                  {/* --- Activity Form Fields --- */}
                  {activeLogType === "activity" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          required
                          value={activityMins}
                          onChange={(e) => setActivityMins(e.target.value)}
                          placeholder="e.g. 30"
                          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary text-ink"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">
                          Activity Type
                        </label>
                        <select
                          value={activityType}
                          onChange={(e) => setActivityType(e.target.value)}
                          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary text-ink"
                        >
                          <option value="Walking">Walking</option>
                          <option value="Running">Running</option>
                          <option value="Cycling">Cycling</option>
                          <option value="Swimming">Swimming</option>
                          <option value="Gym Training">Gym Training</option>
                          <option value="Yoga">Yoga</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Date & Time Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Date Input */}
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Log Date
                      </label>
                      <input
                        type="date"
                        required
                        max={getTodayDateStr()}
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary text-ink"
                      />
                    </div>

                    {/* Time Mode Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Log Time
                      </label>
                      <div className="flex gap-1 p-0.5 bg-bg border border-border rounded-lg h-[38px] items-center">
                        <button
                          type="button"
                          onClick={() => setLogTimeMode("current")}
                          className={`flex-1 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                            logTimeMode === "current"
                              ? "bg-surface text-ink font-bold shadow-2xs border border-border/80"
                              : "text-muted hover:text-ink"
                          }`}
                        >
                          Current
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogTimeMode("custom")}
                          className={`flex-1 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                            logTimeMode === "custom"
                              ? "bg-surface text-ink font-bold shadow-2xs border border-border/80"
                              : "text-muted hover:text-ink"
                          }`}
                        >
                          Custom
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Custom Time Input (Conditional) */}
                  {logTimeMode === "custom" && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Select Time
                      </label>
                      <input
                        type="time"
                        required
                        value={customLogTime}
                        onChange={(e) => setCustomLogTime(e.target.value)}
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary text-ink"
                      />
                    </motion.div>
                  )}

                  {/* Submit button */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeLogModal}
                      className="flex-1 py-2 rounded-lg border border-border font-body text-xs font-semibold text-muted hover:bg-bg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-lg bg-primary text-white font-body text-xs font-semibold hover:bg-primary/95 transition-all shadow-sm cursor-pointer"
                    >
                      {submitting ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        "Save Log"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* --- AI Smart Log Scan modal UI --- */
                <div className="flex flex-col h-[520px]">
                  
                  {/* Phase 1: Upload Dropzone */}
                  {!aiFile && !isManualGrid && (
                    <div className="flex flex-col items-center justify-center flex-1 p-6 text-center gap-4">
                      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 animate-bounce">
                        <Upload size={32} />
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-bold text-ink">Scan Handwritten Log or Screen</h4>
                        <p className="font-body text-xs text-muted max-w-xs mt-1 leading-relaxed">
                          Take a photo or upload a document of your paper log notebook (in Punjabi or English) or your glucose meter.
                        </p>
                      </div>
                      
                      <div className="w-full max-w-xs">
                        <input
                          type="file"
                          id="doc-ocr-upload"
                          accept="image/*,application/pdf"
                          onChange={handleAiUploadChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="doc-ocr-upload"
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-border bg-bg/50 hover:bg-bg cursor-pointer text-xs font-semibold text-ink transition-colors shadow-2xs"
                        >
                          <Upload size={14} /> Select Document
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted">Or skip scanning:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsManualGrid(true);
                            setScannedLogs([
                              {
                                type: "glucose",
                                value: 120,
                                context: "Pre-Meal",
                                selected: true,
                                loggedAt: new Date().toISOString()
                              }
                            ]);
                          }}
                          className="text-primary font-bold hover:underline cursor-pointer"
                        >
                          Start Manual Batch Grid
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Phase 2: Scanning Loader */}
                  {isScanning && (
                    <div className="flex flex-col items-center justify-center flex-1 p-6 text-center gap-3">
                      <Loader2 size={36} className="animate-spin text-indigo-600" />
                      <h4 className="font-display text-sm font-bold text-ink">CareAI is reading your document...</h4>
                      <p className="font-body text-xs text-muted max-w-xs mt-1 leading-relaxed">
                        Translating regional scripts, matching time column headers, and mapping logs. This will take a moment.
                      </p>
                    </div>
                  )}

                  {/* Phase 3: Split-View Checklist & Image Review */}
                  {((scannedLogs.length > 0 && !isScanning) || isManualGrid) && (
                    <div className="flex flex-1 min-h-0 overflow-hidden">
                      
                      {/* Left Pane: Image / Status Preview */}
                      <div className="w-2/5 border-r border-border bg-bg/25 flex flex-col justify-center items-center p-4 min-h-0 select-none">
                        <span className="text-[9px] font-extrabold text-muted uppercase tracking-wider mb-2">Logged Preview</span>
                        {aiFile ? (
                          <div className="border border-border rounded-lg bg-surface p-1.5 w-full h-full max-h-[380px] flex items-center justify-center overflow-hidden">
                            {aiFile.type.startsWith("image/") ? (
                              <img
                                src={URL.createObjectURL(aiFile)}
                                alt="Log sheet source"
                                className="w-full h-full object-contain max-h-[350px] rounded"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center p-6 text-muted text-center">
                                <FileText size={32} className="text-indigo-400 mb-2" />
                                <span className="text-xs font-semibold text-ink truncate max-w-[120px]">{aiFile.name}</span>
                                <span className="text-[8px] text-muted mt-1">(PDF View)</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-6 text-muted text-center">
                            <Sparkles size={32} className="text-indigo-400 mb-2" />
                            <span className="text-xs font-semibold text-ink">Manual Grid View</span>
                            <p className="text-[10px] text-muted mt-1 max-w-[150px]">Enter your logs side-by-side manually.</p>
                          </div>
                        )}
                      </div>

                      {/* Right Pane: Logs List Form */}
                      <div className="w-3/5 flex flex-col justify-between p-4 min-h-0">
                        {submitError && (
                          <div className="flex items-center gap-1.5 p-2 rounded-lg border border-critical/30 bg-critical-light text-critical text-[10px] mb-2">
                            <AlertCircle size={12} />
                            <span>{submitError}</span>
                          </div>
                        )}

                        {submitSuccess && (
                          <div className="flex items-center gap-1.5 p-2 rounded-lg border border-success/30 bg-success-light text-success text-[10px] mb-2">
                            <Check size={12} strokeWidth={3} />
                            <span>{submitSuccess}</span>
                          </div>
                        )}

                        <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[400px] pr-1.5">
                          {scannedLogs.map((log, idx) => (
                            <div key={idx} className="border border-border/80 rounded-xl p-3.5 bg-surface shadow-2xs flex flex-col gap-2.5">
                              
                              {/* Log Header Checkbox */}
                              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="checkbox"
                                    checked={log.selected}
                                    onChange={() => {
                                      const updated = [...scannedLogs];
                                      updated[idx].selected = !updated[idx].selected;
                                      setScannedLogs(updated);
                                    }}
                                    className="w-3.5 h-3.5 accent-primary cursor-pointer"
                                  />
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${
                                    log.type === "glucose" ? "bg-primary-light text-primary border-primary/20" :
                                    log.type === "insulin" ? "bg-critical-light text-critical border-critical/20" :
                                    "bg-warning-light text-warning border-warning/20"
                                  }`}>
                                    {log.type}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setScannedLogs(scannedLogs.filter((_, i) => i !== idx))}
                                  className="text-[10px] text-muted hover:text-critical font-bold transition-colors cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>

                              {/* Form Fields: Glucose */}
                              {log.type === "glucose" && (
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="flex flex-col gap-0.5">
                                    <label className="text-[9px] font-bold text-ink">Glucose (mg/dL)</label>
                                    <input
                                      type="number"
                                      value={log.value}
                                      onChange={(e) => {
                                        const updated = [...scannedLogs];
                                        updated[idx].value = parseFloat(e.target.value) || 0;
                                        setScannedLogs(updated);
                                      }}
                                      className="border border-border bg-bg/50 px-2.5 py-1.5 rounded-lg outline-none text-ink font-semibold focus:border-primary"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <label className="text-[9px] font-bold text-ink">Context</label>
                                    <select
                                      value={log.context || "Fasting"}
                                      onChange={(e) => {
                                        const updated = [...scannedLogs];
                                        updated[idx].context = e.target.value;
                                        setScannedLogs(updated);
                                      }}
                                      className="border border-border bg-bg/50 px-2 py-1.5 rounded-lg outline-none text-ink cursor-pointer focus:border-primary"
                                    >
                                      <option value="Fasting">Fasting</option>
                                      <option value="Pre-Meal">Pre-Meal</option>
                                      <option value="Post-Meal">Post-Meal</option>
                                      <option value="Bedtime">Bedtime</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </div>
                                </div>
                              )}

                              {/* Form Fields: Insulin */}
                              {log.type === "insulin" && (
                                <div className="flex flex-col gap-2">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex flex-col gap-0.5">
                                      <label className="text-[9px] font-bold text-ink">Insulin Units</label>
                                      <input
                                        type="number"
                                        step="0.5"
                                        value={log.value}
                                        onChange={(e) => {
                                          const updated = [...scannedLogs];
                                          updated[idx].value = parseFloat(e.target.value) || 0;
                                          setScannedLogs(updated);
                                        }}
                                        className="border border-border bg-bg/50 px-2.5 py-1.5 rounded-lg outline-none text-ink font-semibold focus:border-primary"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                      <label className="text-[9px] font-bold text-ink">Insulin Type</label>
                                      <select
                                        value={log.insulinType || "Glargine (Long Acting)"}
                                        onChange={(e) => {
                                          const updated = [...scannedLogs];
                                          updated[idx].insulinType = e.target.value;
                                          if (e.target.value === "Other Metals" || e.target.value === "Other Meds") {
                                            updated[idx].customInsulinType = "";
                                          }
                                          setScannedLogs(updated);
                                        }}
                                        className="border border-border bg-bg/50 px-2 py-1.5 rounded-lg outline-none text-ink cursor-pointer focus:border-primary text-[10px]"
                                      >
                                        <option value="Lispro (Meal Time)">Lispro (Meal Time)</option>
                                        <option value="Glargine (Long Acting)">Glargine (Long Acting)</option>
                                        <option value="Aspart (Rapid)">Aspart (Rapid)</option>
                                        <option value="Detemir (Basal)">Detemir (Basal)</option>
                                        <option value="Other Metals">Other Metals</option>
                                        <option value="Other Meds">Other Meds</option>
                                      </select>
                                    </div>
                                  </div>
                                  {(log.insulinType === "Other Metals" || log.insulinType === "Other Meds") && (
                                    <div className="flex flex-col gap-0.5 mt-1.5">
                                      <label className="text-[9px] font-bold text-ink">Custom Medicine Name</label>
                                      <input
                                        type="text"
                                        required
                                        value={log.customInsulinType || ""}
                                        onChange={(e) => {
                                          const updated = [...scannedLogs];
                                          updated[idx].customInsulinType = e.target.value;
                                          setScannedLogs(updated);
                                        }}
                                        placeholder="e.g. Gold Bhasma, Metformin"
                                        className="border border-border bg-bg/50 px-2.5 py-1.5 rounded-lg outline-none text-ink focus:border-primary text-xs"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Form Fields: Meal */}
                              {log.type === "meal" && (
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="flex flex-col gap-0.5">
                                    <label className="text-[9px] font-bold text-ink">Carbs (grams)</label>
                                    <input
                                      type="number"
                                      value={log.value}
                                      onChange={(e) => {
                                        const updated = [...scannedLogs];
                                        updated[idx].value = parseFloat(e.target.value) || 0;
                                        setScannedLogs(updated);
                                      }}
                                      className="border border-border bg-bg/50 px-2.5 py-1.5 rounded-lg outline-none text-ink font-semibold focus:border-primary"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <label className="text-[9px] font-bold text-ink">Meal Type</label>
                                    <select
                                      value={log.mealType || "Breakfast"}
                                      onChange={(e) => {
                                        const updated = [...scannedLogs];
                                        updated[idx].mealType = e.target.value;
                                        setScannedLogs(updated);
                                      }}
                                      className="border border-border bg-bg/50 px-2 py-1.5 rounded-lg outline-none text-ink cursor-pointer focus:border-primary"
                                    >
                                      <option value="Breakfast">Breakfast</option>
                                      <option value="Lunch">Lunch</option>
                                      <option value="Dinner">Dinner</option>
                                      <option value="Snack">Snack</option>
                                    </select>
                                  </div>
                                </div>
                              )}

                              {/* Time Override */}
                              <div className="flex flex-col gap-0.5 text-xs">
                                <label className="text-[9px] font-bold text-ink flex items-center gap-1">
                                  <Calendar size={10} className="text-primary" /> Logged Date & Time
                                </label>
                                <input
                                  type="datetime-local"
                                  value={log.loggedAt ? new Date(new Date(log.loggedAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                                  onChange={(e) => {
                                    const updated = [...scannedLogs];
                                    updated[idx].loggedAt = e.target.value ? new Date(e.target.value).toISOString() : null;
                                    setScannedLogs(updated);
                                  }}
                                  className="border border-border bg-bg/50 px-2.5 py-1.5 rounded-lg outline-none text-ink cursor-pointer focus:border-primary font-body"
                                />
                              </div>

                              {/* Notes for Meals */}
                              {log.type === "meal" && (
                                <div className="flex flex-col gap-0.5 text-xs">
                                  <label className="text-[9px] font-bold text-ink">Meal notes</label>
                                  <input
                                    type="text"
                                    value={log.notes || ""}
                                    onChange={(e) => {
                                      const updated = [...scannedLogs];
                                      updated[idx].notes = e.target.value;
                                      setScannedLogs(updated);
                                    }}
                                    placeholder="e.g. 2 Roti and mixed veg"
                                    className="border border-border bg-bg/50 px-2.5 py-1.5 rounded-lg outline-none text-ink focus:border-primary"
                                  />
                                </div>
                              )}

                            </div>
                          ))}

                          {/* Add manual logs inline */}
                          <button
                            type="button"
                            onClick={() => {
                              const nowStr = new Date().toISOString();
                              setScannedLogs([
                                ...scannedLogs,
                                {
                                  type: "glucose",
                                  value: 110,
                                  context: "Fasting",
                                  selected: true,
                                  loggedAt: nowStr
                                }
                              ]);
                            }}
                            className="w-full border border-dashed border-border/80 hover:border-primary/40 text-[10px] py-2 rounded-xl text-muted font-extrabold hover:text-primary transition-all flex items-center justify-center gap-1 bg-surface cursor-pointer"
                          >
                            <Plus size={11} /> Add Log Entry Row
                          </button>
                        </div>

                        {/* Footer Submits */}
                        <div className="flex gap-2 pt-3 border-t border-border/60 mt-3.5">
                          <button
                            type="button"
                            onClick={() => {
                              setScannedLogs([]);
                              setAiFile(null);
                              setIsManualGrid(false);
                            }}
                            className="flex-1 py-2 bg-surface hover:bg-bg border border-border rounded-lg text-muted font-body text-xs font-semibold cursor-pointer"
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveExtractedLogs}
                            disabled={submitting || scannedLogs.filter(l => l.selected).length === 0}
                            className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white rounded-lg font-body text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {submitting ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              "Log to Diary"
                            )}
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
