import { useState, useEffect } from "react";
import { 
  Droplet, Syringe, UtensilsCrossed, Footprints, Flame, Award, 
  Plus, Check, X, Loader2, ChevronRight, AlertCircle, Sparkles
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
  fetchGamificationStatus 
} from "../../api/patient.api.js";

export function PatientDashboardPlaceholder() {
  const { user } = useAuth();
  const [dailyLog, setDailyLog] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Quick Log Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeLogType, setActiveLogType] = useState("glucose"); // 'glucose' | 'insulin' | 'meal' | 'activity'
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Form states
  const [glucoseValue, setGlucoseValue] = useState("");
  const [glucoseContext, setGlucoseContext] = useState("Pre-Meal");

  const [carbValue, setCarbValue] = useState("");
  const [mealType, setMealType] = useState("Breakfast");
  const [mealNotes, setMealNotes] = useState("");

  const [insulinUnits, setInsulinUnits] = useState("");
  const [insulinType, setInsulinType] = useState("Lispro (Meal Time)");
  const [insulinReason, setInsulinReason] = useState("Meal Bolus");

  const [activityMins, setActivityMins] = useState("");
  const [activityType, setActivityType] = useState("Walking");

  const getTodayDateStr = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().slice(0, 10);
  };

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      if (activeLogType === "glucose") {
        const val = parseFloat(glucoseValue);
        if (isNaN(val) || val <= 0) throw new Error("Glucose value must be a positive number.");
        await logGlucose({ value: val, context: glucoseContext });
      } else if (activeLogType === "meal") {
        const carbs = parseFloat(carbValue);
        if (isNaN(carbs) || carbs < 0) throw new Error("Carb intake must be a positive number.");
        await logMeal({ carbs, mealType, notes: mealNotes || undefined });
      } else if (activeLogType === "insulin") {
        const units = parseFloat(insulinUnits);
        if (isNaN(units) || units <= 0) throw new Error("Insulin units must be a positive number.");
        await logInsulin({ units, insulinType, reason: insulinReason });
      } else if (activeLogType === "activity") {
        const duration = parseInt(activityMins);
        if (isNaN(duration) || duration <= 0) throw new Error("Activity duration must be a positive integer.");
        await logActivity({ durationMins: duration, activityType });
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

  // Compute log completion checklist
  const hasGlucose = dailyLog?.glucose?.length > 0;
  const hasInsulin = dailyLog?.insulin?.length > 0;
  const hasMeals = dailyLog?.meals?.length > 0;
  const hasActivity = dailyLog?.activity?.length > 0;

  const checklist = [
    { id: "glucose", name: "Glucose Reading", status: hasGlucose, count: dailyLog?.glucose?.length || 0, icon: Droplet, color: "text-primary bg-primary-light" },
    { id: "insulin", name: "Insulin Administered", status: hasInsulin, count: dailyLog?.insulin?.length || 0, icon: Syringe, color: "text-critical bg-critical-light" },
    { id: "meal", name: "Meal / Carbohydrates", status: hasMeals, count: dailyLog?.meals?.length || 0, icon: UtensilsCrossed, color: "text-warning bg-warning-light" },
    { id: "activity", name: "Physical Activity", status: hasActivity, count: dailyLog?.activity?.length || 0, icon: Footprints, color: "text-success bg-success-light" }
  ];

  const loggedCount = checklist.filter((item) => item.status).length;
  const progressPercent = loggedCount * 25;

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
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success-light text-success hover:bg-success hover:text-white font-body text-xs font-semibold transition-all shadow-sm"
          >
            <Plus size={14} /> Log Activity
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
                      {item.status && (
                        <span className="text-[10px] text-muted font-medium mt-0.5">
                          {item.count} {item.count === 1 ? 'log' : 'logs'} today
                        </span>
                      )}
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
              className="bg-surface rounded-card shadow-lg border border-border w-full max-w-md overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-bg">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    activeLogType === "glucose" ? "bg-primary-light text-primary" :
                    activeLogType === "insulin" ? "bg-critical-light text-critical" :
                    activeLogType === "meal" ? "bg-warning-light text-warning" : "bg-success-light text-success"
                  }`}>
                    {activeLogType === "glucose" && <Droplet size={16} />}
                    {activeLogType === "insulin" && <Syringe size={16} />}
                    {activeLogType === "meal" && <UtensilsCrossed size={16} />}
                    {activeLogType === "activity" && <Footprints size={16} />}
                  </div>
                  <h3 className="font-display text-sm font-bold text-ink capitalize">
                    Log {activeLogType === "meal" ? "Meals/Carbs" : activeLogType}
                  </h3>
                </div>
                <button 
                  onClick={closeLogModal}
                  className="p-1 rounded-lg text-muted hover:bg-bg hover:text-ink transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
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
                      </select>
                    </div>
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

                {/* Submit button */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeLogModal}
                    className="flex-1 py-2 rounded-lg border border-border font-body text-xs font-semibold text-muted hover:bg-bg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-lg bg-primary text-white font-body text-xs font-semibold hover:bg-primary/95 transition-all shadow-sm"
                  >
                    {submitting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      "Save Log"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
