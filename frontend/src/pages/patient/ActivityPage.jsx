// Activity screen. Deliberately duration-only — no Steps or Calories
// stat cards, since neither exists in the backend (see log.service.js's
// getActivitySummary comment: both are blocked on a device-integration/
// estimation-method decision that hasn't been made). Showing fake zeros
// for untracked metrics would be worse than not showing them at all.

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Trophy } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { fetchActivitySummary, logActivity, updateActivityLog, deleteActivityLog } from "../../api/patient.api.js";
import { formatTime } from "../../utils/format.js";

const DONUT_COLORS = ["#2B6CB0", "#2F9E6E", "#C2831F", "#8B5CF6", "#C4432E"];

export function ActivityPage() {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  function load() {
    setIsLoading(true);
    fetchActivitySummary().then(setSummary).finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(logId) {
    if (!confirm("Delete this activity entry?")) return;
    await deleteActivityLog(logId);
    load();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Button onClick={() => { setEditingLog(null); setShowModal(true); }}>
          <Plus size={14} /> Add Activity
        </Button>
      </div>

      {isLoading ? (
        <p className="font-body text-sm text-muted">Loading…</p>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Today's Activity" value={summary.stats.todayTotalMins} unit="min" />
            <StatCard label="This Week" value={summary.stats.weekTotalMins} unit="min" />
            <Card className="p-4">
              <p className="font-body text-xs font-medium text-muted">Weekly Goal Progress</p>
              <p className="numeral mt-1 text-xl font-semibold text-ink">
                {summary.stats.weekTotalMins} / {summary.stats.weeklyGoalMins} min
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{ width: `${Math.min(100, summary.stats.weeklyProgressPercent)}%` }}
                />
              </div>
            </Card>
          </div>

          {summary.mostActiveDay && (
            <Card className="flex items-center gap-3 !p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-light text-warning">
                <Trophy size={16} />
              </div>
              <p className="font-body text-sm text-ink">
                Most active day this week: <span className="font-semibold">{new Date(summary.mostActiveDay.date).toLocaleDateString("en-US", { weekday: "long" })}</span> with {summary.mostActiveDay.mins} minutes.
              </p>
            </Card>
          )}

          <Card className="p-0">
            {summary.logs.length === 0 ? (
              <p className="px-5 py-10 text-center font-body text-sm text-muted">No activity logged this week.</p>
            ) : (
              <table className="w-full text-left">
                <thead className="border-b border-border bg-bg/60">
                  <tr>
                    {["Time", "Activity", "Duration", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-3 font-body text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.logs.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-body text-sm text-ink">{formatTime(log.loggedAt)}</td>
                      <td className="px-5 py-3 font-body text-sm text-muted">{log.activityType || "Activity"}</td>
                      <td className="px-5 py-3 numeral text-sm font-semibold text-ink">{log.durationMins} min</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => { setEditingLog(log); setShowModal(true); }} className="text-muted hover:text-primary"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(log.id)} className="text-muted hover:text-critical"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <p className="mb-4 font-display text-sm font-bold text-ink">Activity Breakdown</p>
              {summary.breakdown.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={summary.breakdown} dataKey="mins" nameKey="activityType" innerRadius={55} outerRadius={80} paddingAngle={2}>
                      {summary.breakdown.map((entry, i) => <Cell key={entry.activityType} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v} min`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-10 text-center font-body text-sm text-muted">No data yet.</p>
              )}
            </Card>

            <Card>
              <p className="mb-4 font-display text-sm font-bold text-ink">Weekly Overview</p>
              {summary.dailyTrend.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={summary.dailyTrend}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#5B6B82" }} tickFormatter={(d) => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11, fill: "#5B6B82" }} />
                    <Tooltip formatter={(v) => `${v} min`} />
                    <ReferenceLine y={summary.stats.weeklyGoalMins / 7} stroke="#2F9E6E" strokeDasharray="4 4" label={{ value: "Daily avg goal", fontSize: 10, fill: "#2F9E6E" }} />
                    <Bar dataKey="mins" fill="#2B6CB0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-10 text-center font-body text-sm text-muted">No data yet.</p>
              )}
            </Card>
          </div>
        </>
      ) : null}

      {showModal && (
        <ActivityFormModal
          existing={editingLog}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, unit }) {
  return (
    <Card className="p-4">
      <p className="font-body text-xs font-medium text-muted">{label}</p>
      <p className="numeral mt-1 text-xl font-semibold text-ink">{value} {unit}</p>
    </Card>
  );
}

function ActivityFormModal({ existing, onClose, onSaved }) {
  const [form, setForm] = useState({
    durationMins: existing?.durationMins || "",
    activityType: existing?.activityType || "Walking",
  });
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...form, durationMins: Number(form.durationMins) };
      if (existing) await updateActivityLog(existing.id, payload);
      else await logActivity(payload);
      onSaved();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title={existing ? "Edit Activity" : "Add Activity"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="mb-1.5 block font-body text-sm font-medium text-ink">Activity Type</label>
          <select value={form.activityType} onChange={(e) => setForm({ ...form, activityType: e.target.value })} className="w-full rounded-lg border border-border px-3.5 py-2.5 font-body text-sm">
            <option>Walking</option>
            <option>Running</option>
            <option>Yoga</option>
            <option>Stretching</option>
            <option>Cycling</option>
            <option>Other</option>
          </select>
        </div>
        <Input label="Duration (minutes)" type="number" required value={form.durationMins} onChange={(e) => setForm({ ...form, durationMins: e.target.value })} />
        <Button type="submit" isLoading={isSaving} className="mt-2 w-full">{existing ? "Save Changes" : "Add Activity"}</Button>
      </form>
    </Modal>
  );
}
