// Insulin Records screen. Data was already flowing through the app (via
// Daily Log) — this is the dedicated view the mockup showed, with its own
// summary stats and trend chart.

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { fetchInsulinSummary, logInsulin, updateInsulinLog, deleteInsulinLog } from "../../api/patient.api.js";
import { formatTime } from "../../utils/format.js";

const TABS = [
  { key: "All", label: "All" },
  { key: "Rapid Acting", label: "Rapid Acting" },
  { key: "Long Acting", label: "Long Acting" },
];

const DONUT_COLORS = ["#2B6CB0", "#2F9E6E"];

export function InsulinRecordsPage() {
  const [tab, setTab] = useState("All");
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  function load() {
    setIsLoading(true);
    fetchInsulinSummary(7).then(setSummary).finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  const filteredLogs = summary?.logs.filter((log) => {
    if (tab === "All") return true;
    const type = (log.insulinType || "").toLowerCase();
    if (tab === "Rapid Acting") {
      return type.includes("rapid") || type.includes("meal");
    }
    if (tab === "Long Acting") {
      return type.includes("long") || type.includes("basal");
    }
    return false;
  });

  async function handleDelete(logId) {
    if (!confirm("Delete this insulin record?")) return;
    await deleteInsulinLog(logId);
    load();
  }

  const donutData = summary
    ? [
        { name: "Rapid Acting", value: summary.breakdown.rapidTotal },
        { name: "Long Acting", value: summary.breakdown.longTotal },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg border px-3.5 py-2 font-body text-sm font-medium transition-colors ${
                tab === t.key ? "border-primary bg-primary-light text-primary" : "border-border bg-surface text-muted hover:bg-bg"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button onClick={() => { setEditingLog(null); setShowModal(true); }}>
          <Plus size={14} /> Add New Record
        </Button>
      </div>

      {isLoading ? (
        <p className="font-body text-sm text-muted">Loading…</p>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Today" value={summary.stats.totalDailyDose} unit="U" />
            <StatCard label="Avg per Day (7d)" value={summary.stats.avgPerDay} unit="U" />
            <StatCard label="Total Doses (7d)" value={summary.stats.totalDoses} />
            <StatCard label="Most Used Type" value={summary.stats.mostUsedType || "—"} isText />
          </div>

          <Card className="p-0">
            {filteredLogs.length === 0 ? (
              <p className="px-5 py-10 text-center font-body text-sm text-muted">No insulin records in this category.</p>
            ) : (
              <table className="w-full text-left">
                <thead className="border-b border-border bg-bg/60">
                  <tr>
                    {["Date & Time", "Type", "Dose", "Reason", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-3 font-body text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-body text-sm text-ink">{formatTime(log.loggedAt)}</td>
                      <td className="px-5 py-3 font-body text-sm text-muted">{log.insulinType || "—"}</td>
                      <td className="px-5 py-3 numeral text-sm font-semibold text-ink">{log.units} U</td>
                      <td className="px-5 py-3 font-body text-sm text-muted">{log.reason || "—"}</td>
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
              <p className="mb-4 font-display text-sm font-bold text-ink">Insulin Summary (7 Days)</p>
              {donutData.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={donutData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                      {donutData.map((entry, i) => <Cell key={entry.name} fill={DONUT_COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v} U`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-10 text-center font-body text-sm text-muted">No data yet.</p>
              )}
            </Card>

            <Card>
              <p className="mb-4 font-display text-sm font-bold text-ink">Insulin Trend (7 Days)</p>
              {summary.dailyTrend.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={summary.dailyTrend}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#5B6B82" }} tickFormatter={(d) => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11, fill: "#5B6B82" }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rapid" stackId="a" fill="#2B6CB0" name="Rapid Acting" />
                    <Bar dataKey="long" stackId="a" fill="#2F9E6E" name="Long Acting" />
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
        <InsulinFormModal
          existing={editingLog}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, unit, isText }) {
  return (
    <Card className="p-4">
      <p className="font-body text-xs font-medium text-muted">{label}</p>
      <p className={`mt-1 font-semibold text-ink ${isText ? "text-base" : "numeral text-xl"}`}>
        {value}{!isText && unit ? ` ${unit}` : ""}
      </p>
    </Card>
  );
}

function InsulinFormModal({ existing, onClose, onSaved }) {
  const STANDARD_INSULINS = [
    "Lispro (Meal Time)",
    "Basalog (Long-Acting)",
    "Tresba (Long-Acting)",
    "Huminsulin (Long-Acting)",
    "Basugine (Meal Time)",
    "Glargine (Long-Acting)"
  ];

  const isStandard = !existing?.insulinType || STANDARD_INSULINS.includes(existing.insulinType);
  const initialInsulinType = isStandard 
    ? (existing?.insulinType || "Lispro (Meal Time)") 
    : (existing.insulinType.toLowerCase().includes("metal") ? "Other Metals" : "Other Meds");

  const [form, setForm] = useState({
    units: existing?.units || "",
    insulinType: initialInsulinType,
    reason: existing?.reason || "",
  });
  const [customInsulinType, setCustomInsulinType] = useState(isStandard ? "" : existing.insulinType);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const finalInsulinType = (form.insulinType === "Other Metals" || form.insulinType === "Other Meds")
        ? customInsulinType.trim() || form.insulinType
        : form.insulinType;
      const payload = { ...form, insulinType: finalInsulinType, units: Number(form.units) };
      if (existing) await updateInsulinLog(existing.id, payload);
      else await logInsulin(payload);
      onSaved();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title={existing ? "Edit Insulin Record" : "Add Insulin Record"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input label="Dose (units)" type="number" step="0.5" required value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} />
        <div>
          <label className="mb-1.5 block font-body text-sm font-medium text-ink">Type</label>
          <select value={form.insulinType} onChange={(e) => setForm({ ...form, insulinType: e.target.value })} className="bg-surfaceInset w-full rounded-lg border border-border px-3.5 py-2.5 font-body text-sm">
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
        {(form.insulinType === "Other Metals" || form.insulinType === "Other Meds") && (
          <Input 
            label="Custom Medicine Name" 
            required 
            value={customInsulinType} 
            onChange={(e) => setCustomInsulinType(e.target.value)} 
            placeholder="e.g. Gold Bhasma, Metformin" 
          />
        )}
        <Input label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Breakfast, Basal" />
        <Button type="submit" isLoading={isSaving} className="mt-2 w-full">{existing ? "Save Changes" : "Add Record"}</Button>
      </form>
    </Modal>
  );
}
