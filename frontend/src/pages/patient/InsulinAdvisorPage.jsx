import { useEffect, useState } from "react";
import { 
  TrendingUp, AlertTriangle, CheckCircle, Info, 
  Activity, ShieldAlert, ChevronRight, Loader2, RefreshCw 
} from "lucide-react";
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ReferenceArea, ReferenceLine 
} from "recharts";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { fetchInsulinAdjustmentAdvice } from "../../api/insulinAdvisor.api.js";

export function InsulinAdvisorPage() {
  const [advice, setAdvice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchInsulinAdjustmentAdvice();
      setAdvice(data);
    } catch (err) {
      console.error("Failed to load insulin advice:", err);
      setError("Failed to generate insulin dosage recommendations. Please ensure you have logs stored.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusConfig = (status) => {
    switch (status) {
      case "HIGH_TREND":
        return {
          bg: "bg-critical-light border-critical/30",
          text: "text-critical",
          icon: AlertTriangle,
          badge: "Action Suggested",
          title: "Elevated Blood Glucose Trend"
        };
      case "LOW_TREND":
        return {
          bg: "bg-warning-light border-warning/30",
          text: "text-warning-dark",
          icon: ShieldAlert,
          badge: "Adjustment Suggested",
          title: "Hypoglycemia Risk Detected"
        };
      case "INSUFFICIENT_DATA":
        return {
          bg: "bg-bg border-border",
          text: "text-muted",
          icon: Info,
          badge: "Logs Needed",
          title: "Awaiting Log Entries"
        };
      default:
        return {
          bg: "bg-success-light border-success/30",
          text: "text-success",
          icon: CheckCircle,
          badge: "Stable Range",
          title: "Glycemic Levels in Target Range"
        };
    }
  };

  const statusConfig = advice ? getStatusConfig(advice.status) : null;
  const StatusIcon = statusConfig?.icon;

  // Format recommendations into list elements
  const formatRecommendations = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, index) => {
      if (line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.")) {
        return (
          <li key={index} className="font-body text-xs text-ink leading-relaxed pl-1 my-1">
            <strong>{line.substring(0, 2)}</strong> {line.substring(2).trim()}
          </li>
        );
      }
      return (
        <p key={index} className="font-body text-xs text-ink leading-relaxed my-2">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
            <TrendingUp className="text-primary" /> Insulin Dose Tracker & Advisor
          </h2>
          <p className="font-body text-sm text-muted">
            CareAI monitors your multi-day glucose averages and calculates recommendations to optimize your insulin coverage.
          </p>
        </div>
        <Button variant="secondary" onClick={loadData} disabled={isLoading} className="flex items-center gap-1">
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-24 bg-surface border border-border/80 rounded-card">
          <Loader2 size={36} className="animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="border-critical/30 bg-critical-light text-center p-8">
          <AlertTriangle size={36} className="text-critical mx-auto mb-2" />
          <p className="font-body text-sm text-critical font-semibold">{error}</p>
        </Card>
      ) : advice ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Recommendations & Banners */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Status Card Banner */}
            <div className={`p-5 rounded-card border shadow-xs flex gap-4 ${statusConfig.bg}`}>
              <div className={`p-3 bg-surface rounded-xl border border-border flex-shrink-0 flex items-center justify-center`}>
                <StatusIcon size={24} className={statusConfig.text} />
              </div>
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider bg-surface ${statusConfig.text}`}>
                  {statusConfig.badge}
                </span>
                <h3 className="font-display text-base font-bold text-ink mt-2">
                  {statusConfig.title}
                </h3>
                <p className="font-body text-xs text-muted mt-1 leading-snug">
                  {advice.message}
                </p>
              </div>
            </div>

            {/* Recommendations Content */}
            <Card className="border-border/80 shadow-sm">
              <h4 className="font-display text-sm font-bold text-ink mb-3 flex items-center gap-1.5 pb-2.5 border-b border-border/60">
                <Activity size={16} className="text-primary" /> CareAI Advisor Suggestions
              </h4>
              <div className="flex flex-col gap-1">
                {advice.status === "INSUFFICIENT_DATA" ? (
                  <p className="font-body text-xs text-muted leading-relaxed">
                    {advice.recommendation}
                  </p>
                ) : (
                  <ul className="list-none space-y-1">
                    {formatRecommendations(advice.recommendation)}
                  </ul>
                )}
              </div>
            </Card>

            {/* Medical Disclaimer Card */}
            <div className="p-4 bg-bg border border-border rounded-xl flex gap-3 items-start">
              <Info size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <p className="font-body text-[10px] text-muted leading-relaxed">
                <strong>Attention:</strong> {advice.disclaimer}
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Correlation Chart */}
          <Card className="lg:col-span-7 border-border/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start border-b border-border/60 pb-3 mb-4">
                <div>
                  <h4 className="font-display text-sm font-bold text-ink">Insulin vs Glucose Correlation</h4>
                  <p className="font-body text-xs text-muted">Compares your daily average blood glucose levels (mg/dL) against logged insulin doses (Units) over the past week.</p>
                </div>
                {advice.averageGlucose && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">7D Average Glucose</span>
                    <span className="numeral text-lg font-extrabold text-ink">{advice.averageGlucose} <span className="text-[10px] font-medium font-body text-muted">mg/dL</span></span>
                  </div>
                )}
              </div>

              {/* Correlation Composed Chart */}
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={advice.dailySeries} margin={{ left: -10, right: -10, top: 10 }}>
                    <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: "#64748B" }} 
                      tickFormatter={(d) => d.substring(5)} 
                    />
                    
                    {/* Y-Axis Left (Glucose levels) */}
                    <YAxis 
                      yAxisId="left" 
                      domain={[0, 300]} 
                      tick={{ fontSize: 10, fill: "#2B6CB0" }}
                      label={{ value: "Glucose (mg/dL)", angle: -90, position: "insideLeft", fontSize: 9, fill: "#2B6CB0", offset: -2 }}
                    />
                    
                    {/* Y-Axis Right (Insulin units) */}
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      domain={[0, 'auto']} 
                      tick={{ fontSize: 10, fill: "#0D9488" }}
                      label={{ value: "Insulin (Units)", angle: 90, position: "insideRight", fontSize: 9, fill: "#0D9488", offset: -2 }}
                    />
                    
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, borderColor: "#E2E8F0", fontSize: 11 }}
                      formatter={(value, name) => {
                        if (name === "Avg Glucose") return [`${value} mg/dL`, name];
                        return [`${value} Units`, name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                    
                    {/* Reference Band for Glycemic Target Range (70-180 mg/dL) */}
                    <ReferenceArea yAxisId="left" y1={70} y2={180} fill="#10B981" fillOpacity={0.06} />
                    <ReferenceLine yAxisId="left" y={180} stroke="#EF4444" strokeDasharray="3 3" />
                    <ReferenceLine yAxisId="left" y={70} stroke="#F59E0B" strokeDasharray="3 3" />
                    
                    {/* Stacked Bars for Insulin Doses (mapped to Right Y-Axis) */}
                    <Bar yAxisId="right" dataKey="rapidInsulin" stackId="insulin" fill="#3B82F6" name="Rapid Acting" barSize={16} />
                    <Bar yAxisId="right" dataKey="longInsulin" stackId="insulin" fill="#10B981" name="Long Acting / Basal" barSize={16} />
                    
                    {/* Glucose trend line (mapped to Left Y-Axis) */}
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="averageGlucose" 
                      stroke="#2B6CB0" 
                      strokeWidth={3} 
                      name="Avg Glucose"
                      dot={{ r: 4, fill: "#2B6CB0", strokeWidth: 1 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

        </div>
      ) : null}
    </div>
  );
}
