// Admin Dashboard. Deliberately does NOT include a "System Health" panel
// (no real server/database monitoring wired up — see the blueprint) or an
// approval-queue panel (that workflow doesn't exist: patients self-
// register and doctors are admin-created, both active immediately, no
// review step). Every number here is a real query against real data.

import { useEffect, useState } from "react";
import { Users, Stethoscope, Building2, Activity, Bell } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card } from "../../components/ui/Card.jsx";
import { fetchDashboardStats, fetchRegistrationTrend } from "../../api/admin.api.js";
import { formatRelativeTime } from "../../utils/format.js";
import { useAuth } from "../../context/AuthContext.jsx";

const ROLE_COLORS = { patients: "#2B6CB0", doctors: "#2F9E6E", hospitalAdmins: "#C2831F" };

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchRegistrationTrend(7)])
      .then(([statsData, trendData]) => {
        setStats(statsData);
        setTrend(trendData);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <p className="font-body text-sm text-muted">Loading dashboard…</p>;
  if (!stats) return <p className="font-body text-sm text-critical">Couldn't load dashboard.</p>;

  const roleData = [
    { name: "Patients", value: stats.roleCounts.patients },
    { name: "Doctors", value: stats.roleCounts.doctors },
    { name: "Hospital Admins", value: stats.roleCounts.hospitalAdmins },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Admin Greeting & Scoping Metadata */}
      <Card className="relative overflow-hidden border-border/80">
        <p className="font-display text-xl font-bold text-ink">
          Administrator Control Panel
        </p>
        <p className="mt-1 font-body text-sm text-muted">
          Accessing central system logs, hospital profiles, staff accounts, and ticket routing.
        </p>
        <div className="flex flex-wrap gap-2 mt-4 font-body text-xs text-muted">
          <span className="px-2.5 py-1 rounded-lg bg-bg border border-border/80 shadow-xs">
            Administrator: <strong className="text-ink">{user?.email}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-bg border border-border/80 shadow-xs">
            System Role: <strong className="text-ink capitalize">{user?.role?.replace("_", " ").toLowerCase()}</strong>
          </span>
          {user?.hospitalId && (
            <span className="px-2.5 py-1 rounded-lg bg-bg border border-border/80 shadow-xs">
              Hospital Tenant ID: <strong className="text-ink uppercase">{user.hospitalId.slice(0, 8)}...</strong>
            </span>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={Users} label="Total Patients" value={stats.totalPatients} />
        <StatCard icon={Stethoscope} label="Total Doctors" value={stats.totalDoctors} />
        <StatCard icon={Building2} label="Hospitals" value={stats.totalHospitals} />
        <StatCard icon={Activity} label="Active Users (7d)" value={stats.activeUsers7Days} />
        <StatCard icon={Bell} label="Alerts (7d)" value={stats.alertsTriggered7Days} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="mb-4 font-display text-sm font-bold text-ink">Patient Registration Trend (7 Days)</p>
          {trend.some((t) => t.count > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#5B6B82" }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: "#5B6B82" }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2B6CB0" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center font-body text-sm text-muted">No new registrations in the last 7 days.</p>
          )}
        </Card>

        <Card>
          <p className="mb-4 font-display text-sm font-bold text-ink">User Breakdown</p>
          {roleData.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={2}>
                  {roleData.map((entry) => (
                    <Cell key={entry.name} fill={ROLE_COLORS[entry.name.toLowerCase().replace(" ", "")] || "#8B5CF6"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center font-body text-sm text-muted">No users yet.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-0">
          <p className="px-5 pt-5 font-display text-sm font-bold text-ink">Recent Patients</p>
          <RecentList
            items={stats.recentPatients}
            emptyText="No patients registered yet."
            renderRow={(p) => ({ name: p.fullName, sub: formatRelativeTime(p.createdAt), active: p.user?.isActive })}
          />
        </Card>

        <Card className="p-0">
          <p className="px-5 pt-5 font-display text-sm font-bold text-ink">Recent Doctors</p>
          <RecentList
            items={stats.recentDoctors}
            emptyText="No doctors added yet."
            renderRow={(d) => ({ name: d.fullName, sub: d.specialization || formatRelativeTime(d.createdAt), active: d.user?.isActive })}
          />
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const toneClass = { warning: "bg-warning-light text-warning" }[tone] || "bg-primary-light text-primary";
  return (
    <Card className="p-4">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon size={16} />
      </div>
      <p className="font-body text-xs font-medium text-muted">{label}</p>
      <p className="numeral mt-0.5 text-xl font-semibold text-ink">{value}</p>
    </Card>
  );
}

function RecentList({ items, emptyText, renderRow }) {
  if (!items?.length) {
    return <p className="px-5 py-8 text-center font-body text-sm text-muted">{emptyText}</p>;
  }
  return (
    <ul className="mt-3">
      {items.map((item) => {
        const row = renderRow(item);
        return (
          <li key={item.id} className="flex items-center justify-between border-t border-border px-5 py-3">
            <div>
              <p className="font-body text-sm font-medium text-ink">{row.name}</p>
              <p className="font-body text-xs text-muted">{row.sub}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 font-body text-[10px] font-semibold ${row.active ? "bg-success-light text-success" : "bg-bg text-muted"}`}>
              {row.active ? "Active" : "Inactive"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
