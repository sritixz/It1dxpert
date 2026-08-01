// Patients list — filter tabs read live counts from the backend response
// rather than being hardcoded, so a tab's number is never stale. Search is
// deliberately NOT included here even though the reference mockup has a
// search box: the backend's listPatients doesn't support a search param
// yet, and faking client-side search over just the current page of results
// would be misleading (it'd silently miss matches on other pages).

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { StatusPill } from "../../components/ui/StatusPill.jsx";
import { fetchPatients } from "../../api/doctor.api.js";
import { formatRelativeTime, calculateAge } from "../../utils/format.js";

const TABS = [
  { key: undefined, label: "All", countKey: "all" },
  { key: "IN_RANGE", label: "In Range", countKey: "inRange" },
  { key: "HIGH", label: "High", countKey: "high" },
  { key: "LOW", label: "Low", countKey: "low" },
  { key: "INACTIVE", label: "Inactive", countKey: "inactive" },
];

const PAGE_SIZE = 20;

export function PatientsListPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(undefined);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");

    fetchPatients({ status, page, pageSize: PAGE_SIZE })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "Couldn't load patients.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, page]);

  function selectTab(tabKey) {
    setStatus(tabKey);
    setPage(1);
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <div className="flex flex-col gap-5">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = status === tab.key;
          const count = result?.counts?.[tab.countKey];
          return (
            <button
              key={tab.label}
              onClick={() => selectTab(tab.key)}
              className={`rounded-lg border px-3.5 py-2 font-body text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary bg-primary-light text-primary"
                  : "border-border bg-surface text-muted hover:bg-bg"
              }`}
            >
              {tab.label}
              {count != null && <span className="ml-1.5 opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {error && (
        <Card className="border-critical/30 bg-critical-light">
          <p className="font-body text-sm text-critical">{error}</p>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-bg/60">
            <tr>
              {["Patient", "Age / Gender", "Type", "Current Glucose", "Status", "Last Updated", ""].map((h) => (
                <th key={h} className="px-5 py-3 font-body text-xs font-semibold uppercase tracking-wide text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center font-body text-sm text-muted">
                  Loading patients…
                </td>
              </tr>
            )}

            {!isLoading && result?.patients.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center font-body text-sm text-muted">
                  No patients match this filter.
                </td>
              </tr>
            )}

            {!isLoading &&
              result?.patients.map((patient) => (
                <tr key={patient.id} className="border-b border-border last:border-0 hover:bg-bg/40">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light font-display text-sm font-bold text-primary">
                        {patient.fullName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="font-body text-sm font-semibold text-ink">{patient.fullName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-body text-sm text-muted">
                    {calculateAge(patient.dateOfBirth) ?? "—"} / {patient.gender || "—"}
                  </td>
                  <td className="px-5 py-3.5 font-body text-sm text-muted">
                    {patient.diabetesType === "TYPE_1" ? "T1D" : patient.diabetesType === "TYPE_2" ? "T2D" : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="numeral text-sm font-semibold text-ink">
                      {patient.currentGlucose != null ? `${patient.currentGlucose} mg/dL` : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusPill status={patient.status} />
                  </td>
                  <td className="px-5 py-3.5 font-body text-sm text-muted">
                    {formatRelativeTime(patient.lastUpdated)}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-primary"
                      title="View glucose trends"
                      aria-label={`View glucose trends for ${patient.fullName}`}
                    >
                      <LineChart size={16} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>

      {result && result.total > PAGE_SIZE && (
        <div className="flex items-center justify-between font-body text-sm text-muted">
          <span>
            Page {result.page} of {totalPages} — {result.total} patient{result.total === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}