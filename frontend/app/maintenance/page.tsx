"use client";

import { useEffect, useState } from "react";
import { apiFetch, formatCurrency } from "@/lib/utils";
import { Wrench, AlertTriangle, Bell, RefreshCw, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TruckRisk {
  truck_id: string; unit_number: string; make: string; model_year: number;
  status: string; event_count: number; total_cost: number; total_downtime: number;
  risk_score: number; risk_level: "HIGH" | "MEDIUM" | "LOW";
}
interface Metrics { total_events_30d: number; total_cost_30d: number; avg_downtime_hours: number; high_risk_trucks: number; fleet_total: number }

const riskColor = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e" };
const levelStyle: Record<string, string> = {
  HIGH:   "bg-red-500/10 text-red-400 border border-red-500/25",
  MEDIUM: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
  LOW:    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
};

function MetricCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-5 border ${highlight ? "bg-red-500/8 border-red-500/20" : "bg-slate-900 border-slate-800"}`}>
      <p className="text-xs text-slate-500 mb-2 text-wrap-balance">{label}</p>
      <p className={`text-2xl font-bold tabular leading-none ${highlight ? "text-red-400" : "text-white"}`}>{value}</p>
      <p className="text-xs text-slate-600 mt-1.5">{sub}</p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-800/50">
      {[1,2,3,4,5,6,7].map(i => (
        <td key={i} className="px-4 py-3"><div className="skeleton h-4 w-full rounded" /></td>
      ))}
    </tr>
  );
}

export default function MaintenancePage() {
  const [risks, setRisks] = useState<TruckRisk[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [alerting, setAlerting] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiFetch<{ data: TruckRisk[] }>("/api/maintenance/risks"),
      apiFetch<{ data: Metrics }>("/api/maintenance/metrics"),
    ])
      .then(([r, m]) => { setRisks(r.data); setMetrics(m.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const triggerAlert = async () => {
    setAlerting(true); setAlertMsg("");
    try {
      const res = await apiFetch<{ message: string }>("/api/maintenance/trigger-alert", { method: "POST" });
      setAlertMsg(res.message);
    } catch (e: any) { setAlertMsg(e.message || "Error"); }
    finally { setAlerting(false); }
  };

  const chartData = risks.slice(0, 18).map(r => ({
    name: r.unit_number, score: Math.round(r.risk_score * 100), level: r.risk_level,
  }));

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">UC1 · Maintenance</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight text-wrap-balance">Predictive Maintenance Hub</h1>
          <p className="text-slate-400 text-sm mt-1.5 text-wrap-pretty">
            AI-scored truck risk · Daily automated alerts · 90-day analysis window · Real AI4I sensor data
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={load}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors duration-150 min-w-[40px] min-h-[40px] justify-center">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={triggerAlert} disabled={alerting}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium transition-colors duration-150 min-h-[40px]">
            <Bell className="w-4 h-4" />
            {alerting ? "Sending…" : "Send Alert"}
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
          {alertMsg}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics ? (
          <>
            <MetricCard label="High-Risk Trucks"      value={String(metrics.high_risk_trucks)}          sub={`of ${metrics.fleet_total} total`} highlight={metrics.high_risk_trucks > 0} />
            <MetricCard label="Maintenance Events (30d)" value={String(metrics.total_events_30d)}       sub="corrective + preventive" />
            <MetricCard label="Total Cost (30d)"      value={formatCurrency(metrics.total_cost_30d)}     sub="parts + labor" />
            <MetricCard label="Avg Downtime"          value={`${metrics.avg_downtime_hours.toFixed(1)}h`} sub="per event" />
          </>
        ) : (
          [0,1,2,3].map(i => (
            <div key={i} className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton h-7 w-16 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          ))
        )}
      </div>

      {/* Chart */}
      {!loading && chartData.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-300">Fleet Risk Scores — Top 18 Trucks</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.06)" }}
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
                formatter={(v: number) => [`${v}`, "Risk Score"]}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={riskColor[entry.level as keyof typeof riskColor]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-300">All Trucks — Risk Assessment</h2>
          {!loading && <span className="ml-auto text-xs text-slate-600 tabular">{risks.length} trucks</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["Unit", "Vehicle", "Events (90d)", "Cost (90d)", "Downtime", "Risk Score", "Level"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [0,1,2,3,4,5,6,7].map(i => <SkeletonRow key={i} />)
                : risks.map((r, i) => (
                  <tr key={r.truck_id} className="border-b border-slate-800/40 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.unit_number}</td>
                    <td className="px-4 py-3 text-slate-300">{r.make} <span className="text-slate-500">{r.model_year}</span></td>
                    <td className="px-4 py-3 text-slate-400 tabular">{r.event_count}</td>
                    <td className="px-4 py-3 text-slate-400 tabular">{formatCurrency(r.total_cost)}</td>
                    <td className="px-4 py-3 text-slate-400 tabular">{r.total_downtime.toFixed(1)}h</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${r.risk_score * 100}%`, background: riskColor[r.risk_level] }} />
                        </div>
                        <span className="text-slate-500 tabular text-xs w-7">{(r.risk_score * 100).toFixed(0)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md ${levelStyle[r.risk_level]}`}>
                        {r.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
