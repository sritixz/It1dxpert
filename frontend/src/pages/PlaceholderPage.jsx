import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  ClipboardList, LineChart, Pill, Award, Settings, 
  Users, Bell, User, Building2, ShieldCheck, Plus, Check, ChevronRight, AlertTriangle,
  Syringe, Activity, Calendar, Clock
} from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { fetchDailyLog, logGlucose, logMeal, logInsulin } from "../api/patient.api.js";
import { formatTime } from "../utils/format.js";

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

  const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
  const [logs, setLogs] = useState({ glucose: [], insulin: [], meals: [], activity: [] });
  const [summary, setSummary] = useState({ avgGlucose: 0, totalCarbs: 0, totalInsulin: 0, totalActivityMins: 0 });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [glucoseValue, setGlucoseValue] = useState("");
  const [glucoseContext, setGlucoseContext] = useState("Pre-Meal");
  
  const [carbValue, setCarbValue] = useState("");
  const [mealType, setMealType] = useState("Breakfast");
  const [mealNotes, setMealNotes] = useState("");

  const [insulinUnits, setInsulinUnits] = useState("");
  const [insulinType, setInsulinType] = useState("Lispro (Meal Time)");
  const [insulinReason, setInsulinReason] = useState("Meal Bolus");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    const promises = [];

    // 1. Glucose
    if (glucoseValue.trim()) {
      const val = parseFloat(glucoseValue);
      if (isNaN(val) || val <= 0) {
        setError("Glucose value must be a positive number.");
        setIsSaving(false);
        return;
      }
      promises.push(logGlucose({ value: val, context: glucoseContext || undefined }));
    }

    // 2. Carbs
    if (carbValue.trim()) {
      const carbs = parseFloat(carbValue);
      if (isNaN(carbs) || carbs < 0) {
        setError("Carb intake must be a non-negative number.");
        setIsSaving(false);
        return;
      }
      promises.push(logMeal({ carbs, mealType: mealType || undefined, notes: mealNotes || undefined }));
    }

    // 3. Insulin
    if (insulinUnits.trim()) {
      const units = parseFloat(insulinUnits);
      if (isNaN(units) || units <= 0) {
        setError("Insulin units must be a positive number.");
        setIsSaving(false);
        return;
      }
      promises.push(logInsulin({ units, insulinType: insulinType || undefined, reason: insulinReason || undefined }));
    }

    if (promises.length === 0) {
      setError("Please fill in at least one field (Glucose, Carbs, or Insulin) to log.");
      setIsSaving(false);
      return;
    }

    try {
      await Promise.all(promises);
      
      // Clear inputs
      setGlucoseValue("");
      setGlucoseContext("Pre-Meal");
      setCarbValue("");
      setMealType("Breakfast");
      setMealNotes("");
      setInsulinUnits("");
      setInsulinType("Lispro (Meal Time)");
      setInsulinReason("Meal Bolus");
      
      setSuccess("Entries saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
      
      // Reload daily log
      await loadDailyLog(selectedDate);
    } catch (err) {
      console.error("Error saving log entries:", err);
      setError(err.response?.data?.message || "Failed to save log entries.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatLogTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Combine and sort all logs chronologically (oldest first for daily progression)
  const timelineItems = [
    ...logs.glucose.map((g) => ({ ...g, logType: "GLUCOSE" })),
    ...logs.insulin.map((i) => ({ ...i, logType: "INSULIN" })),
    ...logs.meals.map((m) => ({ ...m, logType: "MEAL" })),
    ...logs.activity.map((a) => ({ ...a, logType: "ACTIVITY" })),
  ].sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt));

  const totalEntries = timelineItems.length;
  
  const hasGlucose = logs.glucose.length > 0;
  const hasInsulin = logs.insulin.length > 0;
  const hasMeals = logs.meals.length > 0;
  const hasActivity = logs.activity.length > 0;

  const categories = [
    { name: "Glucose Reading", status: hasGlucose },
    { name: "Insulin Dose", status: hasInsulin },
    { name: "Carbs / Meal", status: hasMeals },
    { name: "Activity", status: hasActivity },
  ];

  const loggedCount = categories.filter((c) => c.status).length;
  const progressPercent = loggedCount * 25;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          {/* Header & Date Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 mb-6 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-ink">Today's Logs</h3>
                <span className="text-xs font-semibold text-primary bg-primary-light px-2 py-0.5 rounded-full">
                  {totalEntries} {totalEntries === 1 ? "entry" : "entries"}
                </span>
              </div>
              <p className="text-xs text-muted">View and manage logs for different days</p>
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
              <span className="text-xs font-bold text-ink">Daily Logging Progress</span>
              <span className="text-xs font-bold text-primary">{progressPercent}% Complete</span>
            </div>
            
            {/* Progress Bar Track */}
            <div className="w-full h-2 bg-border rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            
            {/* Categories Status Badges */}
            <div className="flex flex-wrap gap-2 mt-1.5">
              {categories.map((c) => (
                <span 
                  key={c.name} 
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors border ${
                    c.status 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-surface text-muted border-border"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${c.status ? "bg-green-500 animate-pulse" : "bg-muted"}`} />
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Daily Aggregate Summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-lg bg-bg p-3 border border-border text-center sm:text-left">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Avg Glucose</p>
              <p className={`mt-1 text-lg font-bold ${
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
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Carbs</p>
              <p className="mt-1 text-lg font-bold text-ink">
                {summary.totalCarbs || 0}g
              </p>
            </div>
            <div className="rounded-lg bg-bg p-3 border border-border text-center sm:text-left">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Insulin</p>
              <p className="mt-1 text-lg font-bold text-primary">
                {summary.totalInsulin || 0} U
              </p>
            </div>
          </div>

          {/* Logs Timeline */}
          {isLoading ? (
            <p className="py-10 text-center font-body text-sm text-muted">Loading logs...</p>
          ) : timelineItems.length === 0 ? (
            <p className="py-10 text-center font-body text-sm text-muted">No logs recorded for this date.</p>
          ) : (
            <div className="mt-6 space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {timelineItems.map((item) => {
                let title = "";
                let details = null;
                let bgClass = "bg-primary-light text-primary";
                let IconComponent = ClipboardList;

                if (item.logType === "GLUCOSE") {
                  IconComponent = LineChart;
                  title = "Glucose Reading";
                  const isHypo = item.value < 70;
                  const isHyper = item.value > 140;
                  bgClass = isHypo ? "bg-red-100 text-red-700" : isHyper ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";
                  details = (
                    <span>
                      Glucose: <strong className="text-ink">{item.value} mg/dL</strong>
                      {item.context && <span className="text-muted font-normal"> ({item.context})</span>}
                    </span>
                  );
                } else if (item.logType === "INSULIN") {
                  IconComponent = Syringe;
                  title = "Insulin Dose";
                  bgClass = "bg-blue-100 text-blue-700";
                  details = (
                    <span>
                      Dose: <strong className="text-ink">{item.units} Units</strong>
                      {item.insulinType && <span className="text-muted font-normal"> of {item.insulinType}</span>}
                      {item.reason && <span className="text-muted font-normal"> for {item.reason}</span>}
                    </span>
                  );
                } else if (item.logType === "MEAL") {
                  IconComponent = Pill;
                  title = "Carbohydrate Intake";
                  bgClass = "bg-purple-100 text-purple-700";
                  details = (
                    <span>
                      Carbs: <strong className="text-ink">{item.carbs}g</strong>
                      {item.mealType && <span className="text-muted font-normal"> ({item.mealType})</span>}
                      {item.notes && <span className="text-muted font-normal"> — {item.notes}</span>}
                    </span>
                  );
                } else if (item.logType === "ACTIVITY") {
                  IconComponent = Activity;
                  title = "Physical Activity";
                  bgClass = "bg-green-100 text-green-700";
                  details = (
                    <span>
                      Duration: <strong className="text-ink">{item.durationMins} mins</strong>
                      {item.activityType && <span className="text-muted font-normal"> ({item.activityType})</span>}
                    </span>
                  );
                }

                return (
                  <div key={item.id} className="flex gap-4 relative">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${bgClass} z-10 border-4 border-surface`}>
                      <IconComponent size={12} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <h4 className="text-sm font-bold text-ink">{title}</h4>
                        <span className="text-xs text-muted">{formatLogTime(item.loggedAt)}</span>
                      </div>
                      <div className="mt-1 flex gap-4 text-xs font-medium text-muted">
                        {details}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Log Form Column */}
      <div>
        <Card className="h-full">
          <h3 className="font-display text-base font-bold text-ink border-b border-border pb-4">Log New Entry</h3>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {/* Blood Glucose Section */}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Blood Glucose (mg/dL)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="e.g. 110"
                  value={glucoseValue}
                  onChange={(e) => setGlucoseValue(e.target.value)}
                  className="w-2/3 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-primary text-ink"
                />
                <select
                  value={glucoseContext}
                  onChange={(e) => setGlucoseContext(e.target.value)}
                  className="w-1/3 rounded-lg border border-border bg-bg px-2 py-2.5 text-xs outline-none focus:border-primary text-ink"
                >
                  <option value="Fasting">Fasting</option>
                  <option value="Pre-Meal">Pre-Meal</option>
                  <option value="Post-Meal">Post-Meal</option>
                  <option value="Bedtime">Bedtime</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Carb Intake Section */}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Carb Intake (grams)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  placeholder="e.g. 30"
                  value={carbValue}
                  onChange={(e) => setCarbValue(e.target.value)}
                  className="w-2/3 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-primary text-ink"
                />
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-1/3 rounded-lg border border-border bg-bg px-2 py-2.5 text-xs outline-none focus:border-primary text-ink"
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
                className="w-full rounded-lg border border-border bg-bg px-4 py-2 text-xs outline-none focus:border-primary text-ink"
              />
            </div>

            {/* Insulin Dose Section */}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Insulin Dose (units)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  placeholder="Units"
                  value={insulinUnits}
                  onChange={(e) => setInsulinUnits(e.target.value)}
                  className="w-1/2 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm outline-none focus:border-primary text-ink"
                />
                <select
                  value={insulinType}
                  onChange={(e) => setInsulinType(e.target.value)}
                  className="w-1/2 rounded-lg border border-border bg-bg px-2 py-2.5 text-xs outline-none focus:border-primary text-ink"
                >
                  <option value="Lispro (Meal Time)">Lispro (Meal Time)</option>
                  <option value="Basalog (Long-Acting)">Basalog (Long-Acting)</option>
                  <option value="Tresba (Long-Acting)">Tresba (Long-Acting)</option>
                  <option value="Huminsulin (Long-Acting)">Huminsulin (Long-Acting)</option>
                  <option value="Basugine (Meal Time)">Basugine (Meal Time)</option>
                  <option value="Glargine (Long-Acting)">Glargine (Long-Acting)</option>
                </select>
              </div>
              <select
                value={insulinReason}
                onChange={(e) => setInsulinReason(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-4 py-2 text-xs outline-none focus:border-primary text-ink"
              >
                <option value="Meal Bolus">Meal Bolus</option>
                <option value="Correction">Correction</option>
                <option value="Basal Dose">Basal Dose</option>
              </select>
            </div>

            {/* Message/Error States */}
            {error && <p className="text-xs font-semibold text-critical">{error}</p>}
            {success && <p className="text-xs font-semibold text-success">{success}</p>}

            <button 
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium py-3 text-sm transition-colors mt-2 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Plus size={16} /> Save Entry
                </>
              )}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

// 2. Glucose Trends
function GlucoseTrendsPlaceholder() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold text-muted uppercase">Time in Range</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-green-600">82%</span>
            <span className="text-xs text-muted">Target (70-180 mg/dL)</span>
          </div>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-muted uppercase">Average Glucose</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-ink">114 mg/dL</span>
            <span className="text-xs text-muted">Last 7 days</span>
          </div>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-muted uppercase">Est. HbA1c</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-primary">5.6%</span>
            <span className="text-xs text-muted">Excellent Control</span>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="font-display text-base font-bold text-ink">Glucose Chart (24-Hour Trend)</h3>
          <div className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-green-500 inline-block self-center"></span>
            <span className="text-xs text-muted mr-4">Target Range</span>
            <span className="h-3 w-3 rounded-full bg-primary inline-block self-center"></span>
            <span className="text-xs text-muted">Actual Glucose</span>
          </div>
        </div>
        <div className="mt-6 flex h-64 w-full items-end justify-between relative bg-bg rounded-lg border border-border p-4">
          {/* Target Range Band Overlay */}
          <div className="absolute left-0 right-0 bottom-[25%] top-[25%] bg-green-50 opacity-40 border-y border-dashed border-green-200 pointer-events-none"></div>

          {/* Dummy Trend SVG */}
          <svg className="absolute inset-0 h-full w-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M 0,60 Q 20,40 40,65 T 80,45 T 100,55"
              fill="none"
              stroke="#2B6CB0"
              strokeWidth="2"
            />
            {/* Dots on line */}
            <circle cx="0" cy="60" r="1.5" fill="#2B6CB0" />
            <circle cx="25" cy="48" r="1.5" fill="#2B6CB0" />
            <circle cx="50" cy="62" r="1.5" fill="#2B6CB0" />
            <circle cx="75" cy="46" r="1.5" fill="#2B6CB0" />
            <circle cx="100" cy="55" r="1.5" fill="#2B6CB0" />
          </svg>

          {/* Labels */}
          <span className="absolute left-6 top-3 text-[10px] font-bold text-muted">180 mg/dL</span>
          <span className="absolute left-6 bottom-3 text-[10px] font-bold text-muted">70 mg/dL</span>
          <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-[10px] font-bold text-green-700">Target Zone</span>
        </div>
      </Card>
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
                <button className="rounded-lg bg-ink text-white hover:bg-black px-3 py-1 text-xs font-semibold">Contact Patient</button>
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
                <input type="checkbox" defaultChecked={pref.defaultChecked} className="h-4.5 w-4.5 rounded border-border text-primary focus:ring-primary mt-1 cursor-pointer" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
