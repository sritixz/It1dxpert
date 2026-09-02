import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { 
  ClipboardList, LineChart, Pill, Award, Settings, 
  Users, Bell, User, Building2, ShieldCheck, Plus, Check, ChevronRight, AlertTriangle,
  Syringe, Activity, Calendar, Clock, Utensils, Apple, Camera, Upload, Loader2, Sparkles, Pencil, Trash2, Info
} from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceArea, ReferenceLine
} from "recharts";
import { Card } from "../components/ui/Card.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Button } from "../components/ui/Button.jsx";
import { 
  fetchDailyLog, logGlucose, logMeal, logInsulin, fetchGlucoseTrends,
  updateGlucoseLog, deleteGlucoseLog, updateMealLog, deleteMealLog,
  updateInsulinLog, deleteInsulinLog, logActivity, updateActivityLog, deleteActivityLog 
} from "../api/patient.api.js";
import { analyzeMealImage, analyzeMealText } from "../api/ai.api.js";
import { formatTime, formatDateTime } from "../utils/format.js";

export function PlaceholderPage() {
  const location = useLocation();
  const path = location.pathname;

  // Render specific layout based on the path
  if (path.includes("/patient/daily-log")) {
    return <DailyLogPlaceholder />;
  }
  if (path.includes("/patient/glucose-trends")) {
    return <GlucoseTrendsPlaceholder />;
  }
  if (path.includes("/patient/medications")) {
    return <MedicationsPlaceholder />;
  }
  if (path.includes("/patient/badges")) {
    return <BadgesPlaceholder />;
  }
  if (path.includes("/doctor/patients") || path.includes("/admin/patients")) {
    return <PatientsPlaceholder isAdmin={path.includes("/admin")} />;
  }
  if (path.includes("/doctor/alerts")) {
    return <AlertsPlaceholder />;
  }
  if (path.includes("/admin/doctors")) {
    return <DoctorsPlaceholder />;
  }
  if (path.includes("/admin/hospitals")) {
    return <HospitalsPlaceholder />;
  }
  if (path.includes("/admin/hospital-admins")) {
    return <HospitalAdminsPlaceholder />;
  }
  if (path.includes("/settings")) {
    return <SettingsPlaceholder />;
  }

  // Fallback
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
        <ClipboardList size={24} />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-ink">Feature Coming Soon</h3>
      <p className="mt-2 max-w-sm font-body text-sm text-muted">
        We are building the interface for <code className="rounded bg-bg px-1.5 py-0.5 text-xs text-ink">{path}</code>. It will be fully functional in the next phase.
      </p>
    </Card>
  );
}

// 1. Daily Log
function DailyLogPlaceholder() {
  const getLocalDateStr = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().slice(0, 10);
  };

  const getLocalTimeStr = () => {
    const d = new Date();
    return d.toTimeString().slice(0, 5); // "HH:MM"
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
  const [activeTab, setActiveTab] = useState("all"); // "all" | "glucose" | "insulin" | "carbs" | "activity"
  const [logs, setLogs] = useState({ glucose: [], insulin: [], meals: [], activity: [] });
  const [summary, setSummary] = useState({ avgGlucose: 0, totalCarbs: 0, totalInsulin: 0, totalActivityMins: 0 });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit State
  const [editingLog, setEditingLog] = useState(null); // { logType, log }
  const [isEditingSaving, setIsEditingSaving] = useState(false);

  // Time selector states
  const [useCurrentTimeGlucose, setUseCurrentTimeGlucose] = useState(true);
  const [customTimeGlucose, setCustomTimeGlucose] = useState(getLocalTimeStr());

  const [useCurrentTimeCarb, setUseCurrentTimeCarb] = useState(true);
  const [customTimeCarb, setCustomTimeCarb] = useState(getLocalTimeStr());

  const [useCurrentTimeInsulin, setUseCurrentTimeInsulin] = useState(true);
  const [customTimeInsulin, setCustomTimeInsulin] = useState(getLocalTimeStr());

  const [useCurrentTimeActivity, setUseCurrentTimeActivity] = useState(true);
  const [customTimeActivity, setCustomTimeActivity] = useState(getLocalTimeStr());

  // Form states
  const [glucoseValue, setGlucoseValue] = useState("");
  const [glucoseContext, setGlucoseContext] = useState("Pre-Meal");
  
  const [carbValue, setCarbValue] = useState("");
  const [mealType, setMealType] = useState("Breakfast");
  const [mealNotes, setMealNotes] = useState("");
  const [isEstimatingCarbs, setIsEstimatingCarbs] = useState(false);

  const handleDescriptionBlur = async () => {
    if (!mealNotes || mealNotes.trim().length < 3) return;
    setIsEstimatingCarbs(true);
    try {
      const result = await analyzeMealText(mealNotes);
      if (result && result.carbs !== undefined) {
        setCarbValue(result.carbs.toString());
      }
    } catch (err) {
      console.error("Auto carb calculation failed:", err);
    } finally {
      setIsEstimatingCarbs(false);
    }
  };

  const [insulinUnits, setInsulinUnits] = useState("");
  const [insulinType, setInsulinType] = useState("Lispro (Meal Time)");
  const [customInsulinType, setCustomInsulinType] = useState("");
  const [insulinReason, setInsulinReason] = useState("Meal Bolus");

  const [activityDuration, setActivityDuration] = useState("");
  const [activityType, setActivityType] = useState("Walking");

  // Inline AI Finder State
  const [showFinder, setShowFinder] = useState(false);

  const loadDailyLog = async (date) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetchDailyLog(date);
      setLogs({
        glucose: res.glucose || [],
        insulin: res.insulin || [],
        meals: res.meals || [],
        activity: res.activity || [],
      });
      setSummary(res.summary || { avgGlucose: 0, totalCarbs: 0, totalInsulin: 0, totalActivityMins: 0 });
    } catch (err) {
      console.error("Error loading daily log:", err);
      setError("Failed to load daily log entries.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDailyLog(selectedDate);
  }, [selectedDate]);

  // Build timestamp helper
  const buildLoggedAt = (useCurrent, customTime) => {
    const todayStr = getLocalDateStr();
    if (useCurrent && selectedDate === todayStr) {
      return new Date().toISOString();
    } else {
      const [hours, minutes] = customTime.split(":").map(Number);
      const d = new Date(selectedDate);
      d.setHours(hours, minutes, 0, 0);
      return d.toISOString();
    }
  };

  const handleLogGlucose = async (e) => {
    e.preventDefault();
    if (!glucoseValue.trim()) return;
    const val = parseFloat(glucoseValue);
    if (isNaN(val) || val <= 0) {
      setError("Glucose value must be a positive number.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const loggedAt = buildLoggedAt(useCurrentTimeGlucose, customTimeGlucose);
      await logGlucose({ value: val, context: glucoseContext, loggedAt });
      setGlucoseValue("");
      setSuccess("Glucose entry saved!");
      setTimeout(() => setSuccess(""), 3000);
      await loadDailyLog(selectedDate);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save Glucose log.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogCarbs = async (e) => {
    e.preventDefault();
    if (!carbValue.trim()) return;
    const carbs = parseFloat(carbValue);
    if (isNaN(carbs) || carbs < 0) {
      setError("Carb intake must be a non-negative number.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const loggedAt = buildLoggedAt(useCurrentTimeCarb, customTimeCarb);
      await logMeal({ carbs, mealType, notes: mealNotes || undefined, loggedAt });
      setCarbValue("");
      setMealNotes("");
      setSuccess("Carb entry saved!");
      setTimeout(() => setSuccess(""), 3000);
      await loadDailyLog(selectedDate);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save Carb log.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogInsulin = async (e) => {
    e.preventDefault();
    if (!insulinUnits.trim()) return;
    const units = parseFloat(insulinUnits);
    if (isNaN(units) || units <= 0) {
      setError("Insulin units must be a positive number.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const finalType = (insulinType === "Other Metals" || insulinType === "Other Meds")
        ? customInsulinType.trim() || insulinType
        : insulinType;
      const loggedAt = buildLoggedAt(useCurrentTimeInsulin, customTimeInsulin);
      await logInsulin({ units, insulinType: finalType, reason: insulinReason, loggedAt });
      setInsulinUnits("");
      setCustomInsulinType("");
      setSuccess("Insulin entry saved!");
      setTimeout(() => setSuccess(""), 3000);
      await loadDailyLog(selectedDate);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save Insulin log.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogActivity = async (e) => {
    e.preventDefault();
    if (!activityDuration.trim()) return;
    const durationMins = parseInt(activityDuration, 10);
    if (isNaN(durationMins) || durationMins <= 0) {
      setError("Duration must be a positive integer.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const loggedAt = buildLoggedAt(useCurrentTimeActivity, customTimeActivity);
      await logActivity({ durationMins, activityType, loggedAt });
      setActivityDuration("");
      setSuccess("Activity entry saved!");
      setTimeout(() => setSuccess(""), 3000);
      await loadDailyLog(selectedDate);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save Activity log.");
    } finally {
      setIsSaving(false);
    }
  };

  // Edit action
  const handleEditSave = async (updatedFields) => {
    setIsEditingSaving(true);
    try {
      const { logType, log } = editingLog;
      const id = log.id;
      if (logType === "GLUCOSE") {
        await updateGlucoseLog(id, updatedFields);
      } else if (logType === "INSULIN") {
        await updateInsulinLog(id, updatedFields);
      } else if (logType === "MEAL") {
        await updateMealLog(id, updatedFields);
      } else if (logType === "ACTIVITY") {
        await updateActivityLog(id, updatedFields);
      }
      setEditingLog(null);
      await loadDailyLog(selectedDate);
    } catch (err) {
      alert("Failed to update log entry.");
    } finally {
      setIsEditingSaving(false);
    }
  };

  // Delete action
  const handleDeleteLog = async (logType, id) => {
    if (!confirm("Are you sure you want to permanently delete this log entry?")) return;
    try {
      if (logType === "GLUCOSE") {
        await deleteGlucoseLog(id);
      } else if (logType === "INSULIN") {
        await deleteInsulinLog(id);
      } else if (logType === "MEAL") {
        await deleteMealLog(id);
      } else if (logType === "ACTIVITY") {
        await deleteActivityLog(id);
      }
      await loadDailyLog(selectedDate);
    } catch (err) {
      alert("Failed to delete entry.");
    }
  };

  const formatLogTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatActualTime = (createdAtStr) => {
    if (!createdAtStr) return "N/A";
    return new Date(createdAtStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Timeline Event List - Sorted chronologically (descending for easy viewing of latest)
  const timelineItems = [
    ...logs.glucose.map((g) => ({ ...g, logType: "GLUCOSE" })),
    ...logs.insulin.map((i) => ({ ...i, logType: "INSULIN" })),
    ...logs.meals.map((m) => ({ ...m, logType: "MEAL" })),
    ...logs.activity.map((a) => ({ ...a, logType: "ACTIVITY" })),
  ].sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));

  const totalEntries = timelineItems.length;
  
  // Progress calculations
  const glucoseCount = logs.glucose.length;
  const insulinCount = logs.insulin.length;
  const mealsCount = logs.meals.length;
  const activityCount = logs.activity.length;

  const hasGlucose = glucoseCount >= 4;
  const hasInsulin = insulinCount >= 4;
  const hasMeals = mealsCount >= 4;
  const hasActivity = activityCount >= 4;

  const categories = [
    { name: "Glucose Reading", status: hasGlucose, count: glucoseCount },
    { name: "Insulin Dose", status: hasInsulin, count: insulinCount },
    { name: "Carbs / Meal", status: hasMeals, count: mealsCount },
    { name: "Activity", status: hasActivity, count: activityCount },
  ];

  const totalLogs = Math.min(4, glucoseCount) +
                    Math.min(4, insulinCount) +
                    Math.min(4, mealsCount) +
                    Math.min(4, activityCount);

  const progressPercent = Math.round((totalLogs / 16) * 100);

  const TAB_BUTTONS = [
    { key: "all", label: "All Events", icon: ClipboardList },
    { key: "glucose", label: "Glucose", icon: LineChart },
    { key: "insulin", label: "Insulin", icon: Syringe },
    { key: "carbs", label: "Carbs / Meal", icon: Utensils },
    { key: "activity", label: "Activity", icon: Activity },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Cards & Date Select */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            {/* Header & Date Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 mb-6 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold text-ink">Daily Records</h3>
                  <span className="text-xs font-semibold text-primary bg-primary-light px-2 py-0.5 rounded-full">
                    {totalEntries} {totalEntries === 1 ? "entry" : "entries"}
                  </span>
                </div>
                <p className="text-xs text-muted">View, add, and manage daily health logs</p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-muted" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-primary text-ink"
                />
              </div>
            </div>

            {/* Daily Logging Progress Bar */}
            <div className="mb-6 rounded-xl bg-bg p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink">Completeness Progress</span>
                <span className="text-xs font-bold text-primary">{progressPercent}% Complete</span>
              </div>
              <div className="w-full h-2 bg-border rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {categories.map((c) => (
                  <span 
                    key={c.name} 
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                      c.status 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-surface text-muted border-border"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${c.status ? "bg-green-500 animate-pulse" : "bg-muted"}`} />
                    {c.name} ({c.count}/4)
                  </span>
                ))}
              </div>
            </div>

            {/* Daily Aggregate Summary */}
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-lg bg-bg p-3 border border-border text-center sm:text-left">
                <p className="text-[9px] font-bold text-muted uppercase tracking-wider">Avg Glucose</p>
                <p className={`mt-1 text-base font-bold ${
                  summary.avgGlucose === 0 
                    ? "text-ink" 
                    : summary.avgGlucose < 70 
                      ? "text-critical" 
                      : summary.avgGlucose > 140 
                        ? "text-warning" 
                        : "text-success"
                }`}>
                  {summary.avgGlucose > 0 ? `${summary.avgGlucose} mg/dL` : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-bg p-3 border border-border text-center sm:text-left">
                <p className="text-[9px] font-bold text-muted uppercase tracking-wider">Total Carbs</p>
                <p className="mt-1 text-base font-bold text-ink">
                  {summary.totalCarbs || 0}g
                </p>
              </div>
              <div className="rounded-lg bg-bg p-3 border border-border text-center sm:text-left">
                <p className="text-[9px] font-bold text-muted uppercase tracking-wider">Total Insulin</p>
                <p className="mt-1 text-base font-bold text-primary">
                  {summary.totalInsulin || 0} U
                </p>
              </div>
              <div className="rounded-lg bg-bg p-3 border border-border text-center sm:text-left">
                <p className="text-[9px] font-bold text-muted uppercase tracking-wider">Activity</p>
                <p className="mt-1 text-base font-bold text-ink">
                  {summary.totalActivityMins || 0}m
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Small Instructions Card */}
        <Card className="h-full flex flex-col justify-center bg-primary-light/5 border-primary/10">
          <h4 className="font-display text-sm font-bold text-primary flex items-center gap-1.5">
            <Info size={16} /> Time-Stamping System
          </h4>
          <p className="font-body text-xs text-muted leading-relaxed mt-2">
            Every log records two times:
          </p>
          <ul className="list-disc ml-4 font-body text-xs text-muted mt-1.5 space-y-1.5">
            <li><strong>Logged Time:</strong> The clinical time of the event (e.g. when you measured your sugar or ate your meal). You can customize this.</li>
            <li><strong>Actual Entry Time:</strong> The exact system timestamp showing when the log was uploaded.</li>
          </ul>
        </Card>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: Log Tables / Feed */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Tab switches */}
          <div className="flex bg-bg rounded-xl p-1 border border-border flex-wrap">
            {TAB_BUTTONS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-display text-xs font-semibold transition-all min-w-[90px] ${
                    activeTab === tab.key ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  <TabIcon size={13} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <Card className="p-0">
            {isLoading ? (
              <p className="py-16 text-center font-body text-sm text-muted">Loading logs...</p>
            ) : (
              <LogList 
                activeTab={activeTab} 
                logs={logs} 
                timelineItems={timelineItems} 
                onEdit={(logType, item) => setEditingLog({ logType, log: item })}
                onDelete={(logType, id) => handleDeleteLog(logType, id)}
                formatLogTime={formatLogTime}
                formatActualTime={formatActualTime}
              />
            )}
          </Card>
        </div>

        {/* Right Side: Log Creation Forms */}
        <div>
          <Card className="h-full">
            <h3 className="font-display text-base font-bold text-ink border-b border-border pb-4 flex items-center gap-1.5">
              <Plus size={16} /> Log Daily Entry
            </h3>

            {success && (
              <div className="flex items-center gap-1.5 p-2.5 rounded-lg border border-success/30 bg-success-light text-success text-[11px] font-semibold font-body mt-4 animate-pulse">
                <Check size={12} strokeWidth={3} />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-1.5 p-2.5 rounded-lg border border-critical/30 bg-critical-light text-critical text-[11px] font-semibold font-body mt-4">
                <AlertCircle size={12} />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-4">
              {/* Form rendering depending on selected activeTab (or default to quick selects) */}
              {activeTab === "all" || activeTab === "glucose" ? (
                <form onSubmit={handleLogGlucose} className="space-y-4 pt-2 border-t border-border/40 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide">Glucose Log</span>
                    {activeTab === "all" && <span className="text-[10px] text-muted">Tab: Glucose</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Blood Glucose (mg/dL)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="e.g. 110"
                        value={glucoseValue}
                        required
                        onChange={(e) => setGlucoseValue(e.target.value)}
                        className="w-2/3 rounded-lg border border-border bg-bg px-4 py-2 text-sm outline-none focus:border-primary text-ink"
                      />
                      <select
                        value={glucoseContext}
                        onChange={(e) => setGlucoseContext(e.target.value)}
                        className="w-1/3 rounded-lg border border-border bg-bg px-2 py-2 text-xs outline-none focus:border-primary text-ink cursor-pointer"
                      >
                        <option value="Fasting">Fasting</option>
                        <option value="Pre-Meal">Pre-Meal</option>
                        <option value="Post-Meal">Post-Meal</option>
                        <option value="Bedtime">Bedtime</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Time stamping inputs */}
                  <TimeSelector 
                    useCurrent={useCurrentTimeGlucose} 
                    setUseCurrent={setUseCurrentTimeGlucose} 
                    customTime={customTimeGlucose} 
                    setCustomTime={setCustomTimeGlucose} 
                  />

                  <Button type="submit" isLoading={isSaving} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold">
                    <Plus size={14} /> Log Glucose
                  </Button>
                </form>
              ) : null}

              {activeTab === "all" || activeTab === "insulin" ? (
                <form onSubmit={handleLogInsulin} className={`space-y-4 ${activeTab === "all" ? "mt-6 pt-6 border-t border-border" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide">Insulin Log</span>
                    {activeTab === "all" && <span className="text-[10px] text-muted">Tab: Insulin</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Insulin Dose (units)</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="number"
                        placeholder="Units"
                        value={insulinUnits}
                        required
                        onChange={(e) => setInsulinUnits(e.target.value)}
                        className="w-1/2 rounded-lg border border-border bg-bg px-4 py-2 text-sm outline-none focus:border-primary text-ink"
                      />
                      <select
                        value={insulinType}
                        onChange={(e) => setInsulinType(e.target.value)}
                        className="w-1/2 rounded-lg border border-border bg-bg px-2 py-2 text-xs outline-none focus:border-primary text-ink cursor-pointer"
                      >
                        <option value="Lispro (Meal Time)">Lispro (Meal Time)</option>
                        <option value="Basalog (Long-Acting)">Basalog (Long-Acting)</option>
                        <option value="Tresba (Long-Acting)">Tresba (Long-Acting)</option>
                        <option value="Huminsulin (Long-Acting)">Huminsulin (Long-Acting)</option>
                        <option value="Basugine (Meal Time)">Basugine (Meal Time)</option>
                        <option value="Glargine (Long-Acting)">Glargine (Long-Acting)</option>
                        <option value="Other Metals">Other Metals</option>
                        <option value="Other Meds">Other Meds</option>
                      </select>
                    </div>
                    {(insulinType === "Other Metals" || insulinType === "Other Meds") && (
                      <input
                        type="text"
                        placeholder="Enter custom medicine/metal name"
                        value={customInsulinType}
                        onChange={(e) => setCustomInsulinType(e.target.value)}
                        className="w-full rounded-lg border border-border bg-bg px-4 py-2 text-xs outline-none focus:border-primary text-ink mb-2"
                        required
                      />
                    )}
                    <select
                      value={insulinReason}
                      onChange={(e) => setInsulinReason(e.target.value)}
                      className="w-full rounded-lg border border-border bg-bg px-4 py-2 text-xs outline-none focus:border-primary text-ink cursor-pointer"
                    >
                      <option value="Meal Bolus">Meal Bolus</option>
                      <option value="Correction">Correction</option>
                      <option value="Basal Dose">Basal Dose</option>
                    </select>
                  </div>

                  <TimeSelector 
                    useCurrent={useCurrentTimeInsulin} 
                    setUseCurrent={setUseCurrentTimeInsulin} 
                    customTime={customTimeInsulin} 
                    setCustomTime={setCustomTimeInsulin} 
                  />

                  <Button type="submit" isLoading={isSaving} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold">
                    <Plus size={14} /> Log Insulin
                  </Button>
                </form>
              ) : null}

              {activeTab === "all" || activeTab === "carbs" ? (
                <div className={`space-y-4 ${activeTab === "all" ? "mt-6 pt-6 border-t border-border" : ""}`}>
                  <form onSubmit={handleLogCarbs} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary uppercase tracking-wide">Carbs / Meal Log</span>
                      {activeTab === "all" && <span className="text-[10px] text-muted">Tab: Carbs</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Carb Intake (grams)</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="number"
                          placeholder="e.g. 30"
                          value={carbValue}
                          required
                          onChange={(e) => setCarbValue(e.target.value)}
                          className="w-2/3 rounded-lg border border-border bg-bg px-4 py-2 text-sm outline-none focus:border-primary text-ink"
                        />
                        <select
                          value={mealType}
                          onChange={(e) => setMealType(e.target.value)}
                          className="w-1/3 rounded-lg border border-border bg-bg px-2 py-2 text-xs outline-none focus:border-primary text-ink cursor-pointer"
                        >
                          <option value="Breakfast">Breakfast</option>
                          <option value="Lunch">Lunch</option>
                          <option value="Dinner">Dinner</option>
                          <option value="Snack">Snack</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Meal description (optional)"
                        value={mealNotes}
                        onChange={(e) => setMealNotes(e.target.value)}
                        onBlur={handleDescriptionBlur}
                        className="w-full rounded-lg border border-border bg-bg px-4 py-2 text-xs outline-none focus:border-primary text-ink"
                      />
                      {isEstimatingCarbs && (
                        <div className="text-[10px] text-primary flex items-center gap-1 mt-1 animate-pulse font-semibold">
                          <Loader2 size={10} className="animate-spin" /> Estimating carbohydrates via CareAI...
                        </div>
                      )}
                    </div>

                    <TimeSelector 
                      useCurrent={useCurrentTimeCarb} 
                      setUseCurrent={setUseCurrentTimeCarb} 
                      customTime={customTimeCarb} 
                      setCustomTime={setCustomTimeCarb} 
                    />

                    <div className="flex gap-2">
                      <Button type="submit" isLoading={isSaving} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold">
                        <Plus size={14} /> Log Carbs
                      </Button>
                      
                      <button
                        type="button"
                        onClick={() => setShowFinder(!showFinder)}
                        className={`px-3 py-2 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all shadow-xs ${
                          showFinder 
                            ? "border-primary bg-primary text-white" 
                            : "border-border bg-surface text-primary hover:bg-primary-light"
                        }`}
                        title="Use Carb & Calorie Finder (AI)"
                      >
                        <Sparkles size={14} />
                      </button>
                    </div>
                  </form>

                  {/* Inline Carb Finder Container */}
                  {showFinder && (
                    <div className="mt-4 p-4 border border-primary/20 bg-primary-light/5 rounded-xl animate-reveal">
                      <InlineCarbFinder 
                        onAutofill={(carbs, details) => {
                          setCarbValue(carbs.toString());
                          setMealNotes(details);
                          setShowFinder(false);
                          setSuccess("Autofilled carbs and description! Check inputs above.");
                          setTimeout(() => setSuccess(""), 4000);
                        }} 
                      />
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === "all" || activeTab === "activity" ? (
                <form onSubmit={handleLogActivity} className={`space-y-4 ${activeTab === "all" ? "mt-6 pt-6 border-t border-border" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide">Activity Log</span>
                    {activeTab === "all" && <span className="text-[10px] text-muted">Tab: Activity</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Duration (minutes)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="e.g. 30"
                        value={activityDuration}
                        required
                        onChange={(e) => setActivityDuration(e.target.value)}
                        className="w-2/3 rounded-lg border border-border bg-bg px-4 py-2 text-sm outline-none focus:border-primary text-ink"
                      />
                      <select
                        value={activityType}
                        onChange={(e) => setActivityType(e.target.value)}
                        className="w-1/3 rounded-lg border border-border bg-bg px-2 py-2 text-xs outline-none focus:border-primary text-ink cursor-pointer"
                      >
                        <option value="Walking">Walking</option>
                        <option value="Running">Running</option>
                        <option value="Yoga">Yoga</option>
                        <option value="Stretching">Stretching</option>
                        <option value="Cycling">Cycling</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <TimeSelector 
                    useCurrent={useCurrentTimeActivity} 
                    setUseCurrent={setUseCurrentTimeActivity} 
                    customTime={customTimeActivity} 
                    setCustomTime={setCustomTimeActivity} 
                  />

                  <Button type="submit" isLoading={isSaving} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold">
                    <Plus size={14} /> Log Activity
                  </Button>
                </form>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Entry Modal */}
      {editingLog && (
        <EditLogModal 
          item={editingLog} 
          onClose={() => setEditingLog(null)} 
          onSave={handleEditSave}
          isSaving={isEditingSaving}
        />
      )}
    </div>
  );
}

// Helper time stamp picker component
function TimeSelector({ useCurrent, setUseCurrent, customTime, setCustomTime }) {
  return (
    <div className="rounded-lg bg-bg p-3 border border-border/80">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-muted uppercase">Logging Timestamp</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUseCurrent(true)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              useCurrent 
                ? "bg-primary text-white shadow-2xs" 
                : "text-muted hover:bg-border/50"
            }`}
          >
            Now
          </button>
          <button
            type="button"
            onClick={() => setUseCurrent(false)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              !useCurrent 
                ? "bg-primary text-white shadow-2xs" 
                : "text-muted hover:bg-border/50"
            }`}
          >
            Custom
          </button>
        </div>
      </div>
      {!useCurrent && (
        <div className="mt-2.5 flex items-center gap-2 animate-reveal">
          <Clock size={12} className="text-muted" />
          <input
            type="time"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-primary text-ink"
          />
        </div>
      )}
    </div>
  );
}

// Log table list component showing tabs filters
function LogList({ activeTab, logs, timelineItems, onEdit, onDelete, formatLogTime, formatActualTime }) {
  const getCategoryLogs = () => {
    switch (activeTab) {
      case "glucose": return logs.glucose.map((g) => ({ ...g, logType: "GLUCOSE" }));
      case "insulin": return logs.insulin.map((i) => ({ ...i, logType: "INSULIN" }));
      case "carbs": return logs.meals.map((m) => ({ ...m, logType: "MEAL" }));
      case "activity": return logs.activity.map((a) => ({ ...a, logType: "ACTIVITY" }));
      default: return timelineItems;
    }
  };

  const list = getCategoryLogs();

  if (list.length === 0) {
    return (
      <div className="py-16 text-center font-body text-sm text-muted">
        No logs recorded in this section for this date.
      </div>
    );
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead className="border-b border-border bg-bg/50">
        <tr className="text-xs font-bold text-muted uppercase">
          <th className="px-5 py-3.5">Log Info</th>
          <th className="px-5 py-3.5">Logged Time</th>
          <th className="px-5 py-3.5">Actual Logged</th>
          <th className="px-5 py-3.5 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {list.map((item) => {
          let title = "";
          let iconColor = "bg-primary-light text-primary border-primary/20";
          let IconComponent = ClipboardList;
          let textDetails = "";

          if (item.logType === "GLUCOSE") {
            IconComponent = LineChart;
            title = "Glucose";
            const isHypo = item.value < 70;
            const isHyper = item.value > 140;
            iconColor = isHypo ? "bg-red-50 text-red-700 border-red-200" : isHyper ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200";
            textDetails = `${item.value} mg/dL (${item.context})`;
          } else if (item.logType === "INSULIN") {
            IconComponent = Syringe;
            title = "Insulin";
            iconColor = "bg-blue-50 text-blue-700 border-blue-200";
            textDetails = `${item.units} U (${item.insulinType}${item.reason ? ` - ${item.reason}` : ""})`;
          } else if (item.logType === "MEAL") {
            IconComponent = Utensils;
            title = "Carbs Intake";
            iconColor = "bg-purple-50 text-purple-700 border-purple-200";
            textDetails = `${item.carbs}g ${item.mealType ? `(${item.mealType})` : ""}${item.notes ? ` - ${item.notes}` : ""}`;
          } else if (item.logType === "ACTIVITY") {
            IconComponent = Activity;
            title = "Activity";
            iconColor = "bg-green-50 text-green-700 border-green-200";
            textDetails = `${item.durationMins} mins (${item.activityType || "Physical Active"})`;
          }

          return (
            <tr key={item.id} className="hover:bg-bg/40 font-body text-xs text-ink transition-colors">
              <td className="px-5 py-3 flex items-center gap-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${iconColor}`}>
                  <IconComponent size={14} />
                </span>
                <div>
                  <span className="font-bold block">{title}</span>
                  <span className="text-[10px] text-muted truncate max-w-xs block">{textDetails}</span>
                </div>
              </td>
              <td className="px-5 py-3 font-semibold text-muted">
                {formatLogTime(item.loggedAt)}
              </td>
              <td className="px-5 py-3 font-medium text-muted/75">
                {formatActualTime(item.createdAt)}
              </td>
              <td className="px-5 py-3 text-right">
                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => onEdit(item.logType, item)}
                    className="p-1 text-muted hover:text-primary rounded border border-transparent hover:border-primary/20 hover:bg-primary-light transition-all"
                    title="Edit entry"
                  >
                    <Pencil size={13} />
                  </button>
                  <button 
                    onClick={() => onDelete(item.logType, item.id)}
                    className="p-1 text-muted hover:text-critical rounded border border-transparent hover:border-critical/20 hover:bg-critical-light transition-all"
                    title="Delete entry"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Edit entry modal implementation
function EditLogModal({ item, onClose, onSave, isSaving }) {
  const { logType, log } = item;

  // Shared date state
  const [logTime, setLogTime] = useState(() => {
    return new Date(log.loggedAt).toTimeString().slice(0, 5); // HH:MM
  });

  // Glucose state
  const [val, setVal] = useState(log.value || "");
  const [ctx, setCtx] = useState(log.context || "Pre-Meal");

  // Insulin state
  const [units, setUnits] = useState(log.units || "");
  const [type, setType] = useState(log.insulinType || "Rapid");
  const [reason, setReason] = useState(log.reason || "Meal Bolus");

  // Meal state
  const [carbs, setCarbs] = useState(log.carbs || "");
  const [mealType, setMealType] = useState(log.mealType || "Breakfast");
  const [notes, setNotes] = useState(log.notes || "");

  // Activity state
  const [duration, setDuration] = useState(log.durationMins || "");
  const [actType, setActType] = useState(log.activityType || "Walking");

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {};
    
    // Construct loggedAt from original date + modified time
    const origDate = log.loggedAt.slice(0, 10);
    const [hours, minutes] = logTime.split(":").map(Number);
    const d = new Date(origDate);
    d.setHours(hours, minutes, 0, 0);
    payload.loggedAt = d.toISOString();

    if (logType === "GLUCOSE") {
      payload.value = parseFloat(val);
      payload.context = ctx;
    } else if (logType === "INSULIN") {
      payload.units = parseFloat(units);
      payload.insulinType = type;
      payload.reason = reason;
    } else if (logType === "MEAL") {
      payload.carbs = parseFloat(carbs);
      payload.mealType = mealType;
      payload.notes = notes;
    } else if (logType === "ACTIVITY") {
      payload.durationMins = parseInt(duration, 10);
      payload.activityType = actType;
    }

    onSave(payload);
  };

  return (
    <Modal title={`Edit ${logType.toLowerCase()} entry`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        {logType === "GLUCOSE" && (
          <>
            <Input
              label="Glucose Value (mg/dL)"
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              required
            />
            <div>
              <label className="mb-1 block font-body text-xs font-semibold text-ink">Context</label>
              <select
                value={ctx}
                onChange={(e) => setCtx(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3.5 py-2 font-body text-xs text-ink outline-none"
              >
                <option value="Fasting">Fasting</option>
                <option value="Pre-Meal">Pre-Meal</option>
                <option value="Post-Meal">Post-Meal</option>
                <option value="Bedtime">Bedtime</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </>
        )}

        {logType === "INSULIN" && (
          <>
            <Input
              label="Insulin Units"
              type="number"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              required
            />
            <Input
              label="Insulin Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            />
            <div>
              <label className="mb-1 block font-body text-xs font-semibold text-ink">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3.5 py-2 font-body text-xs text-ink outline-none"
              >
                <option value="Meal Bolus">Meal Bolus</option>
                <option value="Correction">Correction</option>
                <option value="Basal Dose">Basal Dose</option>
              </select>
            </div>
          </>
        )}

        {logType === "MEAL" && (
          <>
            <Input
              label="Carbohydrates (grams)"
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              required
            />
            <div>
              <label className="mb-1 block font-body text-xs font-semibold text-ink">Meal Category</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3.5 py-2 font-body text-xs text-ink outline-none"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
              </select>
            </div>
            <Input
              label="Meal Description / Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </>
        )}

        {logType === "ACTIVITY" && (
          <>
            <Input
              label="Duration (minutes)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
            <div>
              <label className="mb-1 block font-body text-xs font-semibold text-ink">Activity Type</label>
              <select
                value={actType}
                onChange={(e) => setActType(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3.5 py-2 font-body text-xs text-ink outline-none"
              >
                <option value="Walking">Walking</option>
                <option value="Running">Running</option>
                <option value="Yoga">Yoga</option>
                <option value="Stretching">Stretching</option>
                <option value="Cycling">Cycling</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </>
        )}

        {/* Customizable logged time */}
        <div>
          <label className="mb-1 block font-body text-xs font-semibold text-ink">Logged Time (Event Time)</label>
          <div className="flex items-center gap-2 border border-border bg-bg rounded-lg px-3.5 py-2">
            <Clock size={14} className="text-muted" />
            <input
              type="time"
              value={logTime}
              onChange={(e) => setLogTime(e.target.value)}
              className="w-full bg-transparent font-body text-xs outline-none text-ink cursor-pointer"
              required
            />
          </div>
        </div>

        <Button type="submit" isLoading={isSaving} className="w-full py-2.5 rounded-xl font-bold mt-2">
          Save Changes
        </Button>
      </form>
    </Modal>
  );
}

// Inline Carb Finder component containing the Gemini AI model scan logic
const FOOD_TRIVIA = [
  "Did you know? Fiber in vegetables slows down the rate at which glucose enters your bloodstream, smoothing out spikes.",
  "Type 1 Tip: Matching your insulin dose to carbohydrate intake is key to maintaining a stable blood glucose range.",
  "Protein and fats do not raise blood sugar immediately, but they delay digestion, causing delayed post-meal glucose rises.",
  "Complex carbohydrates like brown rice, oats, and beans have a lower glycemic index, preventing sudden blood sugar spikes.",
  "High-fat meals (like pizza or burgers) can delay carbohydrate absorption, causing hyperglycemia 3-5 hours after eating.",
];

function InlineCarbFinder({ onAutofill }) {
  const [activeSubTab, setActiveSubTab] = useState("photo"); // "photo" | "text"
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [textDescription, setTextDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [triviaIdx, setTriviaIdx] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setTriviaIdx((prev) => (prev + 1) % FOOD_TRIVIA.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setError("");
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    } else {
      setError("Please drop a valid image file.");
    }
  };

  const handleFileChange = (e) => {
    setError("");
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    setAnalysisResult(null);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setError("");
  };

  const handleAnalyze = async () => {
    setError("");
    setAnalysisResult(null);
    setIsLoading(true);

    try {
      let result;
      if (activeSubTab === "photo") {
        if (!imageFile) throw new Error("Please upload or snap a photo of your meal first.");
        result = await analyzeMealImage(imageFile);
      } else {
        if (!textDescription.trim()) throw new Error("Please describe what you ate first.");
        result = await analyzeMealText(textDescription);
      }
      setAnalysisResult(result);
    } catch (err) {
      console.error("Meal analysis error:", err);
      setError(err.message || "Failed to analyze meal. Check Gemini API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutofillAction = () => {
    if (!analysisResult) return;
    const desc = `${analysisResult.mealName} (${analysisResult.portionEstimate}, Cal: ${analysisResult.calories}kcal, P: ${analysisResult.protein}g, F: ${analysisResult.fat}g)`;
    onAutofill(analysisResult.carbs, desc);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="text-[11px] font-bold text-primary flex items-center gap-1">
          <Sparkles size={12} /> Carb & Calorie Finder (AI)
        </span>
        <div className="flex gap-1.5 p-0.5 bg-bg border border-border rounded-lg">
          <button
            type="button"
            onClick={() => { setActiveSubTab("photo"); setAnalysisResult(null); setError(""); }}
            className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
              activeSubTab === "photo" ? "bg-surface text-primary shadow-3xs" : "text-muted"
            }`}
          >
            Photo
          </button>
          <button
            type="button"
            onClick={() => { setActiveSubTab("text"); setAnalysisResult(null); setError(""); }}
            className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
              activeSubTab === "text" ? "bg-surface text-primary shadow-3xs" : "text-muted"
            }`}
          >
            Text
          </button>
        </div>
      </div>

      {activeSubTab === "photo" ? (
        !imagePreview ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-lg flex flex-col items-center justify-center py-6 px-4 text-center cursor-pointer transition-all duration-200 ${
              isDragging 
                ? "border-primary bg-primary-light/10" 
                : "border-border hover:border-primary/50 hover:bg-bg/40"
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="bg-surfaceInset hidden" />
            <Camera size={20} className="text-muted mb-1.5" />
            <span className="block text-[10px] font-semibold text-ink">Upload Plate Photo</span>
            <span className="text-[8px] text-muted block mt-0.5">Drag & drop or click to upload</span>
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden border border-border p-2 bg-bg flex flex-col items-center">
            <img src={imagePreview} alt="Meal Preview" className="max-h-36 max-w-full rounded object-contain" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-3 right-3 p-1.5 bg-critical text-white rounded hover:bg-critical-dark shadow-sm transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )
      ) : (
        <textarea
          value={textDescription}
          onChange={(e) => setTextDescription(e.target.value)}
          placeholder="Describe your meal (e.g. 'I ate two slices of cheese pizza and a small green salad')"
          rows={3}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 font-body text-xs text-ink outline-none focus:border-primary resize-none shadow-2xs"
        />
      )}

      {error && (
        <div className="flex items-center gap-1.5 p-2 rounded-lg border border-critical/30 bg-critical-light text-critical text-[10px] font-body">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={isLoading || (activeSubTab === "photo" ? !imageFile : !textDescription.trim())}
        className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Sparkles size={12} />
        )}
        Analyze Food
      </button>

      {/* Analysis Loading Fact Display */}
      {isLoading && (
        <div className="p-3 bg-bg border border-border rounded-lg text-center mt-1 animate-pulse">
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary text-white font-bold uppercase inline-block mb-1">Trivia</span>
          <p className="font-body text-[10px] text-ink leading-relaxed">{FOOD_TRIVIA[triviaIdx]}</p>
        </div>
      )}

      {/* Result Display & Autofill */}
      {!isLoading && analysisResult && (
        <div className="bg-bg/40 border border-border/80 rounded-lg p-3 flex flex-col gap-3 animate-reveal">
          <div className="border-b border-border/40 pb-2">
            <h5 className="font-display font-bold text-xs capitalize text-ink">{analysisResult.mealName}</h5>
            <span className="text-[9px] text-muted block mt-0.5">Estimated Carbs: <strong>{analysisResult.carbs}g</strong></span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
            <div className="bg-primary-light/20 text-primary p-1.5 rounded border border-primary/20">
              <span className="block font-bold">{analysisResult.calories}</span>
              <span className="text-[8px] uppercase">kcal</span>
            </div>
            <div className="bg-warning-light/20 text-warning p-1.5 rounded border border-warning/20">
              <span className="block font-bold">{analysisResult.carbs}g</span>
              <span className="text-[8px] uppercase">Carbs</span>
            </div>
            <div className="bg-success-light/20 text-success p-1.5 rounded border border-success/20">
              <span className="block font-bold">{analysisResult.protein}g</span>
              <span className="text-[8px] uppercase">Prot</span>
            </div>
            <div className="bg-critical-light/20 text-critical p-1.5 rounded border border-critical/20">
              <span className="block font-bold">{analysisResult.fat}g</span>
              <span className="text-[8px] uppercase">Fat</span>
            </div>
          </div>

          <p className="text-[10px] text-muted leading-relaxed italic bg-bg border border-border/40 p-2 rounded">
            "{analysisResult.glycemicImpact}"
          </p>

          <button
            type="button"
            onClick={handleAutofillAction}
            className="w-full py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            Autofill Carb Intake Fields
          </button>
        </div>
      )}
    </div>
  );
}

// 2. Glucose Trends
function GlucoseTrendsPlaceholder() {
  const [days, setDays] = useState(7);
  const [trends, setTrends] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");

    fetchGlucoseTrends(days)
      .then((data) => {
        if (!cancelled) setTrends(data);
      })
      .catch((err) => {
        if (!cancelled) setError("Failed to load glucose trends.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [days]);

  const chartData = trends?.series.map((point) => ({
    ...point,
    label: formatDateTime(point.loggedAt),
  }));

  const RANGE_OPTIONS = [
    { days: 7, label: "7D" },
    { days: 14, label: "14D" },
    { days: 30, label: "30D" },
    { days: 90, label: "90D" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-ink">Glucose Trends</h3>
        <div className="flex gap-1.5 rounded-lg border border-border bg-surface p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setDays(opt.days)}
              className={`rounded-md px-3 py-1 font-body text-xs font-semibold transition-colors ${
                days === opt.days ? "bg-primary text-white" : "text-muted hover:bg-bg"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && !trends ? (
        <Card>
          <p className="font-body text-sm text-muted py-10 text-center">Loading glucose data…</p>
        </Card>
      ) : error ? (
        <Card className="border-critical/30 bg-critical-light">
          <p className="font-body text-sm text-critical py-4 text-center">{error}</p>
        </Card>
      ) : trends ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs font-semibold text-muted uppercase">Time in Range</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-green-600">{trends.insights.inRangePercent}%</span>
                <span className="text-xs text-muted">Target (70-180 mg/dL)</span>
              </div>
            </Card>
            <Card>
              <p className="text-xs font-semibold text-muted uppercase">Average Glucose</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-ink">
                  {trends.stats.average ? `${trends.stats.average} mg/dL` : "—"}
                </span>
                <span className="text-xs text-muted">Last {days} days</span>
              </div>
            </Card>
            <Card>
              <p className="text-xs font-semibold text-muted uppercase">Est. HbA1c</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-primary">
                  {trends.insights.gmi ? `${trends.insights.gmi}%` : "—"}
                </span>
                <span className="text-xs text-muted">Excellent Control</span>
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-display text-base font-bold text-ink">Glucose Chart ({days}-Day Trend)</h3>
              <div className="flex gap-2 text-xs">
                <span className="h-3 w-3 rounded-full bg-green-500 inline-block self-center"></span>
                <span className="text-muted mr-4">Target Range</span>
                <span className="h-3 w-3 rounded-full bg-primary inline-block self-center"></span>
                <span className="text-muted">Actual Glucose</span>
              </div>
            </div>
            <div className="mt-6">
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
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

// 3. Medications
function MedicationsPlaceholder() {
  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h3 className="font-display text-base font-bold text-ink">My Scheduled Medications</h3>
        <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-bg">
          <Plus size={14} /> Add Med
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {[
          { name: "Lispro (Meal Time)", type: "Meal Time", dose: "Sliding Scale (approx 4-6 U)", schedule: "Before Meals (Breakfast, Lunch, Dinner)" },
          { name: "Glargine (Long-Acting)", type: "Long-acting", dose: "14 Units", schedule: "Bedtime (09:30 PM)" },
        ].map((med, index) => (
          <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between border border-border p-4 rounded-xl hover:border-primary-light transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary mt-0.5">
                <Pill size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">{med.name}</h4>
                <p className="text-xs text-muted mt-0.5">{med.type} • {med.dose}</p>
              </div>
            </div>
            <div className="mt-3 sm:mt-0 text-left sm:text-right">
              <p className="text-xs font-semibold text-primary">{med.schedule}</p>
              <p className="text-[10px] text-muted mt-0.5">Active schedule</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// 4. Badges (Gamification)
function BadgesPlaceholder() {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-ink">Badge System</h3>
            <p className="text-xs text-muted mt-1">Earn achievements by logging and keeping glucose in target range.</p>
          </div>
          <div className="text-right">
            <span className="font-display text-2xl font-extrabold text-primary">3 / 8</span>
            <p className="text-[10px] text-muted">Badges Earned</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: "First Log", desc: "Logged your first glucose value.", unlocked: true, color: "border-green-300 bg-green-50" },
          { name: "3-Day Streak", desc: "Logged readings 3 days in a row.", unlocked: true, color: "border-green-300 bg-green-50" },
          { name: "In Range Expert", desc: "Keep glucose in target for 48h.", unlocked: true, color: "border-green-300 bg-green-50" },
          { name: "Perfect Week", desc: "Log all meals for 7 full days.", unlocked: false, color: "border-border bg-surface opacity-60" },
        ].map((badge, idx) => (
          <Card key={idx} className={`border ${badge.color} text-center flex flex-col items-center p-6`}>
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${badge.unlocked ? 'bg-primary text-white' : 'bg-bg text-muted'}`}>
              <Award size={20} />
            </div>
            <h4 className="mt-4 text-sm font-bold text-ink">{badge.name}</h4>
            <p className="mt-1 text-xs text-muted leading-relaxed">{badge.desc}</p>
            <span className={`mt-4 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badge.unlocked ? 'bg-green-100 text-green-700' : 'bg-bg text-muted'}`}>
              {badge.unlocked ? 'Unlocked' : 'Locked'}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}

// 5. Patients (Doctor/Admin view)
function PatientsPlaceholder({ isAdmin }) {
  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-4">
        <h3 className="font-display text-base font-bold text-ink">Patients Directory</h3>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Search patients..." className="rounded-lg border border-border bg-bg px-3 py-1.5 text-xs outline-none focus:border-primary w-48" />
          {isAdmin && (
            <button className="flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary-dark px-3 py-1.5 text-xs font-semibold text-white">
              <Plus size={14} /> Add Patient
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-bold text-muted uppercase">
              <th className="pb-3 pr-4">Patient Name</th>
              <th className="pb-3 px-4">Age/Gender</th>
              <th className="pb-3 px-4">Type</th>
              <th className="pb-3 px-4">Status</th>
              <th className="pb-3 pl-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-body">
            {[
              { name: "Aarav Sharma", age: "16 / Male", type: "Type 1", status: "Stable", color: "bg-green-100 text-green-700" },
              { name: "Priya Patel", age: "22 / Female", type: "Type 1", status: "Needs Review", color: "bg-amber-100 text-amber-700" },
              { name: "Rahul Verma", age: "11 / Male", type: "Type 1", status: "Critical", color: "bg-red-100 text-red-700" },
            ].map((patient, idx) => (
              <tr key={idx} className="hover:bg-bg/50">
                <td className="py-3.5 pr-4 font-semibold text-ink">{patient.name}</td>
                <td className="py-3.5 px-4 text-muted">{patient.age}</td>
                <td className="py-3.5 px-4 text-muted">{patient.type}</td>
                <td className="py-3.5 px-4">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${patient.color}`}>
                    {patient.status}
                  </span>
                </td>
                <td className="py-3.5 pl-4 text-right">
                  <button className="text-primary hover:underline text-xs font-semibold flex items-center gap-1 ml-auto">
                    View Chart <ChevronRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// 6. Alerts
function AlertsPlaceholder() {
  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h3 className="font-display text-base font-bold text-ink">Active Clinical Alerts</h3>
        <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">2 Critical</span>
      </div>

      <div className="mt-6 space-y-4">
        {[
          { patient: "Rahul Verma", message: "Hypoglycemia Alert: Glucose logged at 54 mg/dL", time: "10 mins ago", level: "Critical", style: "border-red-200 bg-red-50 text-red-800" },
          { patient: "Priya Patel", message: "High Average: Glucose exceeds 220 mg/dL for 3 consecutive readings", time: "1 hour ago", level: "Warning", style: "border-amber-200 bg-amber-50 text-amber-800" },
        ].map((alert, idx) => (
          <div key={idx} className={`flex items-start gap-3 border p-4 rounded-xl ${alert.style}`}>
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase">{alert.level} • {alert.patient}</span>
                <span className="text-[10px] font-medium">{alert.time}</span>
              </div>
              <p className="text-sm font-medium mt-1">{alert.message}</p>
              <div className="mt-3 flex gap-2">
                <button className="rounded-lg bg-surface text-ink hover:bg-bg border border-border px-3 py-1 text-xs font-semibold">Acknowledge</button>
                <button className="rounded-lg bg-primary text-white hover:bg-primary-dark px-3 py-1 text-xs font-semibold">Contact Patient</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// 7. Doctors (Admin view)
function DoctorsPlaceholder() {
  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h3 className="font-display text-base font-bold text-ink">Doctors Roster</h3>
        <button className="flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary-dark px-3 py-1.5 text-xs font-semibold text-white">
          <Plus size={14} /> Invite Doctor
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-bold text-muted uppercase">
              <th className="pb-3 pr-4">Doctor Name</th>
              <th className="pb-3 px-4">Specialization</th>
              <th className="pb-3 px-4">License Number</th>
              <th className="pb-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-body">
            {[
              { name: "Dr. Ananya Goel", spec: "Pediatric Endocrinology", license: "MC-98234", status: "Active" },
              { name: "Dr. Kabir Mehta", spec: "Diabetology", license: "MC-77312", status: "Active" },
            ].map((doc, idx) => (
              <tr key={idx}>
                <td className="py-3.5 pr-4 font-semibold text-ink">{doc.name}</td>
                <td className="py-3.5 px-4 text-muted">{doc.spec}</td>
                <td className="py-3.5 px-4 text-muted">{doc.license}</td>
                <td className="py-3.5 px-4">
                  <span className="inline-block rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-semibold">
                    {doc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// 8. Hospitals (Super Admin view)
function HospitalsPlaceholder() {
  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h3 className="font-display text-base font-bold text-ink">Hospitals Directory</h3>
        <button className="flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary-dark px-3 py-1.5 text-xs font-semibold text-white">
          <Plus size={14} /> Register Hospital
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {[
          { name: "PGI Chandigarh", address: "Sector 12, Chandigarh, 160012", email: "contact@pgichandigarh.edu" },
          { name: "Max Super Specialty", address: "Phase VI, Mohali", email: "info@maxhealthcare.com" },
        ].map((hosp, idx) => (
          <div key={idx} className="flex items-center justify-between border border-border p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
                <Building2 size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">{hosp.name}</h4>
                <p className="text-xs text-muted mt-0.5">{hosp.address} • {hosp.email}</p>
              </div>
            </div>
            <span className="inline-block rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-semibold">Active</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// 9. Hospital Admins (Super Admin view)
function HospitalAdminsPlaceholder() {
  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h3 className="font-display text-base font-bold text-ink">Hospital Admins</h3>
        <button className="flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary-dark px-3 py-1.5 text-xs font-semibold text-white">
          <Plus size={14} /> Create Admin
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {[
          { name: "Suresh Kumar", email: "suresh.admin@pgichandigarh.edu", hospital: "PGI Chandigarh" },
          { name: "Meena Gupta", email: "meena.gupta@maxhealthcare.com", hospital: "Max Super Specialty" },
        ].map((admin, idx) => (
          <div key={idx} className="flex items-center justify-between border border-border p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">{admin.name}</h4>
                <p className="text-xs text-muted mt-0.5">{admin.email} • Admin of <strong className="text-ink">{admin.hospital}</strong></p>
              </div>
            </div>
            <span className="inline-block rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-semibold">Active</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// 10. Settings (Universal Profile)
function SettingsPlaceholder() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <h3 className="font-display text-base font-bold text-ink border-b border-border pb-4">Profile Settings</h3>
          <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">First Name</label>
                <input type="text" defaultValue="John" className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Last Name</label>
                <input type="text" defaultValue="Doe" className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Email Address</label>
              <input type="email" defaultValue="john.doe@example.com" disabled className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm outline-none opacity-60 cursor-not-allowed" />
            </div>
            <button className="rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-2.5 text-sm transition-colors mt-2">
              Save Changes
            </button>
          </form>
        </Card>
      </div>

      <div>
        <Card className="h-full">
          <h3 className="font-display text-base font-bold text-ink border-b border-border pb-4">Notification Preferences</h3>
          <div className="mt-6 space-y-4">
            {[
              { label: "Glucose Alerts", desc: "Notify when glucose is out of range", defaultChecked: true },
              { label: "Medication Reminders", desc: "Reminders to log insulin and pills", defaultChecked: true },
              { label: "Weekly Progress Report", desc: "Digest of glucose averages and statistics", defaultChecked: false },
            ].map((pref, idx) => (
              <div key={idx} className="flex items-start justify-between">
                <div className="pr-4">
                  <h4 className="text-xs font-bold text-ink">{pref.label}</h4>
                  <p className="text-[11px] text-muted mt-0.5">{pref.desc}</p>
                </div>
                <input type="checkbox" defaultChecked={pref.defaultChecked} className="bg-surfaceInset h-4.5 w-4.5 rounded border-border text-primary focus:ring-primary mt-1 cursor-pointer" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
