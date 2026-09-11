import { useEffect, useState } from "react";
import { 
  Droplet, LineChart, FileText, Loader2, Calendar, RefreshCw, ArrowUpRight, ArrowDownRight, Activity
} from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Line, Area, Bar, Brush, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceArea, ReferenceLine,
} from "recharts";
import { Card } from "../../components/ui/Card.jsx";
import { fetchGlucoseTrends, fetchPatient7DayReport } from "../../api/patient.api.js";
import { exportReportToPdf } from "../../utils/pdfExport.js";
import { formatDateTime } from "../../utils/format.js";

const RANGE_OPTIONS = [
  { days: 1, label: "1D (Daily)" },
  { days: 7, label: "7D (Weekly)" },
  { days: 14, label: "14D" },
  { days: 30, label: "30D (Monthly)" },
  { days: 90, label: "90D" },
  { days: 3650, label: "ALL" },
  { days: "CUSTOM", label: "Custom Date Range" },
];

export function PatientGlucoseTrendsPage() {
  const [days, setDays] = useState(7);
  const [chartType, setChartType] = useState("area");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [trends, setTrends] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Could not open report window. Please allow popups for this website.");
      return;
    }
    setIsExporting(true);
    try {
      const data = await fetchPatient7DayReport();
      exportReportToPdf(data, printWindow);
    } catch (err) {
      printWindow.close();
      console.error("Failed to export PDF:", err);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const loadData = () => {
    setIsLoading(true);
    setError("");

    const queryParams = isCustomMode && startDate && endDate
      ? { startDate, endDate, days: "CUSTOM" }
      : { days: days === "CUSTOM" ? 7 : days };

    fetchGlucoseTrends(queryParams)
      .then(setTrends)
      .catch((err) => {
        console.error("Failed to load glucose trends:", err);
        setError("Could not load glucose trend analysis.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [days, isCustomMode, startDate, endDate]);

  const handleRangeChange = (val) => {
    if (val === "CUSTOM") {
      setIsCustomMode(true);
      setDays("CUSTOM");
    } else {
      setIsCustomMode(false);
      setDays(val);
    }
  };

  // Format data for chart with dynamic date/time resolution
  const chartData = trends?.series?.map((item) => {
    const d = new Date(item.loggedAt);
    let label = "";
    
    if (days === 1) {
      label = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days <= 14) {
      label = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    } else {
      label = d.toLocaleDateString([], { month: "short", day: "numeric" });
    }

    return {
      label,
      fullDateTime: formatDateTime(item.loggedAt),
      value: item.value,
      context: item.context || "",
    };
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Presets Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Glucose Trends & Analytics</h1>
          <p className="font-body text-xs text-muted">
            Interactive glucose monitoring, target range bands (70–180 mg/dL), and drag-to-zoom timeline.
          </p>
        </div>

        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 font-display text-xs font-bold text-white transition-all hover:bg-primary-dark shadow-xs self-start sm:self-auto disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          Export PDF Summary
        </button>
      </div>

      {/* Preset Range Selector Buttons */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface p-1.5 shadow-xs">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleRangeChange(opt.days)}
              className={`rounded-lg px-3 py-1.5 font-body text-xs font-semibold transition-all ${
                (isCustomMode && opt.days === "CUSTOM") || (!isCustomMode && days === opt.days)
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted hover:bg-bg hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs */}
        {isCustomMode && (
          <Card className="flex flex-wrap items-center gap-4 bg-primary-light/30 border-primary/20">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-primary" />
              <span className="font-body text-xs font-bold text-ink">Custom Date Range:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-body text-xs text-muted">Start:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 font-body text-xs text-ink focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-body text-xs text-muted">End:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 font-body text-xs text-ink focus:border-primary focus:outline-none"
              />
            </div>
            <button
              onClick={loadData}
              className="rounded-lg bg-primary px-3 py-1.5 font-display text-xs font-bold text-white transition-all hover:bg-primary-dark"
            >
              Apply Filter
            </button>
          </Card>
        )}
      </div>

      {error && (
        <Card className="border-critical/30 bg-critical-light/20">
          <p className="font-body text-xs font-medium text-critical">{error}</p>
        </Card>
      )}

      {isLoading && !trends ? (
        <Card className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={24} />
          <span className="ml-2 font-body text-sm text-muted">Loading glucose analytics...</span>
        </Card>
      ) : trends ? (
        <>
          {/* Summary Stat Cards Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Average" value={trends.stats.average} unit="mg/dL" />
            <StatCard label="Highest" value={trends.stats.highest} unit="mg/dL" />
            <StatCard label="Lowest" value={trends.stats.lowest} unit="mg/dL" />
            <StatCard label="Std. Deviation" value={trends.stats.stdDeviation} unit="mg/dL" />
            <StatCard label="Coeff. of Variation" value={trends.stats.coefficientOfVariation} unit="%" />
            <StatCard label="GMI (est.)" value={trends.insights.gmi} unit="%" />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <StatCard label="Time in Range (70-180)" value={trends.insights.inRangePercent} unit="%" tone="success" />
            <StatCard label="High (>180 mg/dL)" value={trends.insights.highPercent} unit="%" tone="critical" />
            <StatCard label="Low (<70 mg/dL)" value={trends.insights.lowPercent} unit="%" tone="warning" />
          </div>

          {/* Interactive Recharts Graph with Brush Drag-to-Zoom */}
          <Card>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="font-display text-sm font-bold text-ink">Glucose Trend Curve</p>
                <p className="font-body text-xs text-muted">
                  Intraday glucose points with Target Range (70–180 mg/dL). Drag slider at bottom to zoom.
                </p>
              </div>

              {/* Chart Type Selector */}
              <div className="flex items-center gap-1 rounded-lg border border-border bg-surfaceInset p-1">
                {["area", "line", "bar"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`capitalize rounded-md px-2.5 py-1 font-body text-xs font-semibold transition-all ${
                      chartType === type ? "bg-primary text-white shadow-xs" : "text-muted hover:text-ink"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {chartData?.length ? (
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={chartData} margin={{ left: -16, right: 8, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="patientGlucoseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006766" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#006766" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E0ECE9" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#527578" }} minTickGap={24} />
                  <YAxis domain={[0, 300]} tick={{ fontSize: 11, fill: "#527578" }} />
                  <Tooltip
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDateTime || label}
                    formatter={(value, name, item) => [
                      `${value} mg/dL ${item.payload.context ? `(${item.payload.context})` : ""}`,
                      "Glucose"
                    ]}
                    contentStyle={{ borderRadius: 8, borderColor: "#E0ECE9", fontSize: 12, backgroundColor: "#FFFFFF", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  />
                  {/* Target Range Shading (70 - 180 mg/dL) */}
                  <ReferenceArea y1={70} y2={180} fill="#2F9E6E" fillOpacity={0.08} />
                  <ReferenceLine y={180} stroke="#C4432E" strokeDasharray="4 4" label={{ value: "High (180)", fill: "#C4432E", fontSize: 10, position: "insideTopRight" }} />
                  <ReferenceLine y={70} stroke="#C2831F" strokeDasharray="4 4" label={{ value: "Low (70)", fill: "#C2831F", fontSize: 10, position: "insideBottomRight" }} />
                  
                  {chartType === "area" && (
                    <Area type="monotone" dataKey="value" stroke="#006766" strokeWidth={2.5} fill="url(#patientGlucoseGradient)" activeDot={{ r: 6, fill: "#006766", stroke: "#FFFFFF", strokeWidth: 2 }} />
                  )}
                  {chartType === "line" && (
                    <Line type="monotone" dataKey="value" stroke="#006766" strokeWidth={2.5} dot={{ r: 3, fill: "#006766" }} activeDot={{ r: 6, fill: "#006766", stroke: "#FFFFFF", strokeWidth: 2 }} />
                  )}
                  {chartType === "bar" && (
                    <Bar dataKey="value" fill="#006766" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  )}

                  {/* Interactive Drag-to-Zoom Brush Slider */}
                  <Brush dataKey="label" height={26} stroke="#006766" fill="#F4F7F6" tickFormatter={() => ""} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-12 text-center">
                <Droplet className="mx-auto mb-2 text-muted/50" size={32} />
                <p className="font-body text-sm text-muted">No glucose readings logged in this date range.</p>
              </div>
            )}
          </Card>

          {/* Detailed Readings Table */}
          {trends.series?.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display text-sm font-bold text-ink">Logged Readings ({trends.series.length})</p>
                <span className="font-body text-xs text-muted">Chronological Order</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left font-body text-xs text-ink">
                  <thead className="sticky top-0 bg-surfaceInset border-b border-border">
                    <tr>
                      <th className="px-3 py-2 font-semibold text-muted">Date & Time</th>
                      <th className="px-3 py-2 font-semibold text-muted">Reading</th>
                      <th className="px-3 py-2 font-semibold text-muted">Context</th>
                      <th className="px-3 py-2 font-semibold text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {trends.series.map((item, idx) => {
                      const isHigh = item.value > 180;
                      const isLow = item.value < 70;
                      const statusLabel = isHigh ? "High" : isLow ? "Low" : "In Range";
                      const statusClass = isHigh
                        ? "bg-critical-light text-critical"
                        : isLow
                        ? "bg-warning-light text-warning"
                        : "bg-success-light text-success";

                      return (
                        <tr key={idx} className="hover:bg-bg/50">
                          <td className="px-3 py-2 text-muted font-medium">{formatDateTime(item.loggedAt)}</td>
                          <td className="px-3 py-2 font-bold numeral text-ink">{item.value} mg/dL</td>
                          <td className="px-3 py-2 text-muted">{item.context || "—"}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full px-2 py-0.5 font-body text-[10px] font-bold ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, unit, tone }) {
  const textColor =
    tone === "success"
      ? "text-success"
      : tone === "critical"
      ? "text-critical"
      : tone === "warning"
      ? "text-warning"
      : "text-ink";

  return (
    <Card className="flex flex-col justify-between p-3.5">
      <p className="font-body text-[11px] font-semibold text-muted uppercase tracking-wider">{label}</p>
      <p className={`numeral mt-1 text-xl font-bold ${textColor}`}>
        {value !== null && value !== undefined ? value : "—"}
        {unit && <span className="ml-1 text-xs font-normal text-muted">{unit}</span>}
      </p>
    </Card>
  );
}
