// Glucose Monitor — single-patient detail. Time-range tabs are limited to
// 7/14/30/90 days on purpose: the reference mockup shows intraday tabs
// (3H/6H/12H/24H) too, but the backend's getGlucoseTrends only supports
// day-granularity ranges — offering hour tabs that don't actually change
// anything would be a UI that lies about what it does.

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Droplet, Syringe, UtensilsCrossed, Footprints, StickyNote,
} from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceArea, ReferenceLine,
} from "recharts";
import { Card } from "../../components/ui/Card.jsx";
import { fetchPatientOverview, fetchPatientGlucoseTrends, fetchPatientTimeline, fetchPatientAppointmentRecords } from "../../api/doctor.api.js";
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

  function loadRecords() {
    fetchPatientAppointmentRecords(patientId).then(setApptRecords).catch(() => {});
  }

  // Patient name/header info only needs fetching once, not on range change.
  useEffect(() => {
    fetchPatientOverview(patientId).catch(() => {}).then((data) => data && setOverview(data));
    loadRecords();
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