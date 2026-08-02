// Alerts screen. Missed-log detection runs server-side, lazily, whenever
// this page loads (see doctor.service.js's detectMissedLogAlerts) — so
// the "Missed Logs" tab count reflects a check that just ran, not a
// pre-computed nightly job. That's a deliberate simplification (no real
// scheduler in this project yet), not a bug.

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowDown, CalendarX, Check, MessageCircle } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { fetchAlerts, markAlertRead, resolveAlert } from "../../api/doctor.api.js";
import { formatRelativeTime } from "../../utils/format.js";

const TABS = [
  { key: undefined, label: "All" },
  { key: "HIGH_GLUCOSE", label: "High Glucose" },
  { key: "LOW_GLUCOSE", label: "Low Glucose" },
  { key: "MISSED_LOG", label: "Missed Logs" },
];

const TYPE_CONFIG = {
  HIGH_GLUCOSE: { icon: AlertTriangle, className: "bg-critical-light text-critical", label: "High Glucose" },
  LOW_GLUCOSE: { icon: ArrowDown, className: "bg-warning-light text-warning", label: "Low Glucose" },
  MISSED_LOG: { icon: CalendarX, className: "bg-primary-light text-primary", label: "Missed Log" },
};

export function AlertsPage() {
  const [type, setType] = useState(undefined);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null);

  function load() {
    setIsLoading(true);
    setError("");
    fetchAlerts({ type })
      .then(setResult)
      .catch((err) => setError(err.response?.data?.message || "Couldn't load alerts."))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [type]);

  async function handleRead(alertId) {
    setActioningId(alertId);
    try {
      await markAlertRead(alertId);
      load();
    } finally {
      setActioningId(null);
    }
  }

  async function handleResolve(alertId) {
    setActioningId(alertId);
    try {
      await resolveAlert(alertId);
      load();
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {result && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="High Glucose" value={result.summary.highGlucose} tone="critical" />
          <StatCard label="Low Glucose" value={result.summary.lowGlucose} tone="warning" />
          <StatCard label="Missed Logs" value={result.summary.missedLogs} tone="primary" />
          <StatCard label="Total Active" value={result.summary.total} tone="ink" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setType(tab.key)}
            className={`rounded-lg border px-3.5 py-2 font-body text-sm font-medium transition-colors ${
              type === tab.key ? "border-primary bg-primary-light text-primary" : "border-border bg-surface text-muted hover:bg-bg"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <Card className="border-critical/30 bg-critical-light">
          <p className="font-body text-sm text-critical">{error}</p>
        </Card>
      )}

      <Card className="p-0">
        {isLoading ? (
          <p className="px-5 py-10 text-center font-body text-sm text-muted">Loading alerts…</p>
        ) : result?.alerts.length === 0 ? (
          <p className="px-5 py-10 text-center font-body text-sm text-muted">No active alerts. 🎉</p>
        ) : (
          <ul>
            {result?.alerts.map((alert) => {
              const config = TYPE_CONFIG[alert.type] || TYPE_CONFIG.MISSED_LOG;
              const Icon = config.icon;
              return (
                <li key={alert.id} className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-0">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.className}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm font-semibold text-ink">{alert.patient.fullName}</span>
                      {!alert.isRead && (
                        <span className="rounded-full bg-primary px-1.5 py-0.5 font-body text-[10px] font-bold uppercase text-white">
                          New
                        </span>
                      )}
                    </div>
                    <p className="font-body text-sm text-muted">{alert.message}</p>
                  </div>
                  <span className="font-body text-xs text-muted">{formatRelativeTime(alert.createdAt)}</span>
                  <div className="flex gap-1.5">
                    {!alert.isRead && (
                      <button
                        onClick={() => handleRead(alert.id)}
                        disabled={actioningId === alert.id}
                        className="rounded-lg border border-border px-2.5 py-1.5 font-body text-xs font-medium text-muted hover:bg-bg disabled:opacity-50"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => handleResolve(alert.id)}
                      disabled={actioningId === alert.id}
                      className="flex items-center gap-1 rounded-lg bg-success-light px-2.5 py-1.5 font-body text-xs font-semibold text-success hover:bg-success/20 disabled:opacity-50"
                    >
                      <Check size={12} /> Resolve
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const toneClass = { critical: "text-critical", warning: "text-warning", primary: "text-primary", ink: "text-ink" }[tone];
  return (
    <Card className="p-4">
      <p className="font-body text-xs font-medium text-muted">{label}</p>
      <p className={`numeral mt-1 text-2xl font-semibold ${toneClass}`}>{value ?? "—"}</p>
    </Card>
  );
}
