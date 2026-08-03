// Users & Roles screen — scoped to the 4 roles that actually exist in
// this app's RBAC (SUPER_ADMIN, HOSPITAL_ADMIN, DOCTOR, PATIENT). The
// reference mockup showed 8 (Nurse, Data Operator, Clinic Manager,
// Auditor...) — not implemented, since adding roles is a real RBAC/access
// decision, not a UI change. See the blueprint for why.

import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card.jsx";
import { fetchUsers, setUserActive } from "../../api/admin.api.js";
import { formatRelativeTime } from "../../utils/format.js";

const ROLE_TABS = [
  { key: undefined, label: "All" },
  { key: "PATIENT", label: "Patients" },
  { key: "DOCTOR", label: "Doctors" },
  { key: "HOSPITAL_ADMIN", label: "Hospital Admins" },
];

const ROLE_LABELS = { PATIENT: "Patient", DOCTOR: "Doctor", HOSPITAL_ADMIN: "Hospital Admin", SUPER_ADMIN: "Super Admin" };
const ROLE_STYLES = {
  PATIENT: "bg-primary-light text-primary",
  DOCTOR: "bg-success-light text-success",
  HOSPITAL_ADMIN: "bg-warning-light text-warning",
  SUPER_ADMIN: "bg-critical-light text-critical",
};

export function AdminUsersPage() {
  const [role, setRole] = useState(undefined);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  function load() {
    setIsLoading(true);
    fetchUsers({ role, search: search || undefined }).then(setResult).finally(() => setIsLoading(false));
  }

  useEffect(load, [role]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    load();
  }

  async function handleToggleActive(userId, current) {
    await setUserActive(userId, !current);
    load();
  }

  const displayName = (u) => u.patientProfile?.fullName || u.doctorProfile?.fullName || u.email;

  return (
    <div className="flex flex-col gap-5">
      {result && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label="Total" value={result.counts.total} />
          <StatCard label="Active" value={result.counts.active} tone="success" />
          <StatCard label="Inactive" value={result.counts.inactive} tone="muted" />
          <StatCard label="Patients" value={result.counts.patients} />
          <StatCard label="Doctors" value={result.counts.doctors} />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setRole(tab.key)}
              className={`rounded-lg border px-3.5 py-2 font-body text-sm font-medium transition-colors ${
                role === tab.key ? "border-primary bg-primary-light text-primary" : "border-border bg-surface text-muted hover:bg-bg"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="rounded-lg border border-border px-3.5 py-2 font-body text-sm"
          />
          <button type="submit" className="rounded-lg border border-border px-3.5 py-2 font-body text-sm text-muted hover:bg-bg">Search</button>
        </form>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <p className="px-5 py-10 text-center font-body text-sm text-muted">Loading users…</p>
        ) : result?.users.length === 0 ? (
          <p className="px-5 py-10 text-center font-body text-sm text-muted">No users match this filter.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b border-border bg-bg/60">
              <tr>
                {["Name", "Role", "Hospital", "Last Login", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 font-body text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result?.users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-body text-sm font-semibold text-ink">{displayName(u)}</p>
                    <p className="font-body text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 font-body text-xs font-semibold ${ROLE_STYLES[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-body text-sm text-muted">{u.hospital?.name || "—"}</td>
                  <td className="px-5 py-3 font-body text-sm text-muted">{formatRelativeTime(u.lastLoginAt)}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 font-body text-xs font-semibold ${u.isActive ? "bg-success-light text-success" : "bg-bg text-muted"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(u.id, u.isActive)}
                      className="font-body text-xs font-medium text-primary hover:underline"
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const toneClass = { success: "text-success", muted: "text-muted" }[tone] || "text-ink";
  return (
    <Card className="p-4">
      <p className="font-body text-xs font-medium text-muted">{label}</p>
      <p className={`numeral mt-1 text-xl font-semibold ${toneClass}`}>{value}</p>
    </Card>
  );
}
