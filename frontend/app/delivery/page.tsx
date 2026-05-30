"use client";

import { useEffect, useState } from "react";
import { apiFetch, formatCurrency, formatPercent } from "@/lib/utils";
import { TruckIcon, Bell, RefreshCw, Package, AlertTriangle } from "lucide-react";

interface SLA { customer_id: string; customer_name: string; total_deliveries: number; on_time: number; on_time_rate: number; total_revenue: number; sla_health: "HEALTHY" | "AT_RISK" | "BREACHED" }
interface AtRisk { event_id: string; load_id: string; customer_name: string; actual_datetime: string; location_city: string; location_state: string; revenue: number }
interface Metrics { deliveries_30d: number; overall_on_time_rate: number; breached_customers: number; at_risk_customers: number; total_customers: number; late_loads_7d: number }

const healthStyle: Record<string, string> = {
  HEALTHY: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
  AT_RISK: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
  BREACHED:"bg-red-500/10 text-red-400 border border-red-500/25",
};
const rowBg: Record<string, string> = {
  HEALTHY: "",
  AT_RISK: "bg-amber-500/4",
  BREACHED:"bg-red-500/4",
};

export default function DeliveryPage() {
  const [sla, setSla] = useState<SLA[]>([]);
  const [atRisk, setAtRisk] = useState<AtRisk[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [alerting, setAlerting] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiFetch<{ data: SLA[] }>("/api/delivery/sla"),
      apiFetch<{ data: AtRisk[] }>("/api/delivery/at-risk"),
      apiFetch<{ data: Metrics }>("/api/delivery/metrics"),
    ])
      .then(([s, a, m]) => { setSla(s.data); setAtRisk(a.data); setMetrics(m.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const triggerReport = async () => {
    setAlerting(true); setAlertMsg("");
    try {
      const res = await apiFetch<{ message: string }>("/api/delivery/trigger-report", { method: "POST" });
      setAlertMsg(res.message);
    } catch (e: any) { setAlertMsg(e.message || "Error"); }
    finally { setAlerting(false); }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <TruckIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">UC3 · Delivery SLA</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight text-wrap-balance">Customer SLA Intelligence</h1>
          <p className="text-slate-400 text-sm mt-1.5 text-wrap-pretty">
            SLA performance by customer · At-risk loads · Weekly automated reports · Chicago Taxi real data
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={load}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors duration-150 min-h-[40px]">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={triggerReport} disabled={alerting}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors duration-150 min-h-[40px]">
            <Bell className="w-4 h-4" />
            {alerting ? "Sending…" : "Send Report"}
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
          {alertMsg}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics ? (
          [
            { label: "Overall On-Time Rate",  value: formatPercent(metrics.overall_on_time_rate),   sub: "last 30 days",        hi: metrics.overall_on_time_rate < 0.85 },
            { label: "Deliveries (30d)",      value: metrics.deliveries_30d.toLocaleString(),        sub: "real trip records",   hi: false },
            { label: "Breached Customers",    value: String(metrics.breached_customers),             sub: "SLA < 70%",           hi: metrics.breached_customers > 0 },
            { label: "Late Loads (7d)",       value: metrics.late_loads_7d.toLocaleString(),         sub: "missed delivery SLA", hi: metrics.late_loads_7d > 0 },
          ].map(m => (
            <div key={m.label} className={`rounded-xl p-5 border ${m.hi ? "bg-red-500/8 border-red-500/20" : "bg-slate-900 border-slate-800"}`}>
              <p className="text-xs text-slate-500 mb-2 text-wrap-balance">{m.label}</p>
              <p className={`text-2xl font-bold tabular leading-none ${m.hi ? "text-red-400" : "text-white"}`}>{m.value}</p>
              <p className="text-xs text-slate-600 mt-1.5">{m.sub}</p>
            </div>
          ))
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* SLA by customer — wider */}
        <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-300">SLA by Customer (30d)</h2>
            {!loading && <span className="ml-auto text-xs text-slate-600 tabular">{sla.length} customers</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {["Customer", "Deliveries", "On-Time", "Revenue", "Health"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [0,1,2,3,4].map(i => (
                    <tr key={i} className="border-b border-slate-800/40">
                      {[1,2,3,4,5].map(j => <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>)}
                    </tr>
                  ))
                  : sla.map(s => (
                    <tr key={s.customer_id} className={`border-b border-slate-800/40 hover:bg-slate-800/30 ${rowBg[s.sla_health]}`}>
                      <td className="px-4 py-3 text-slate-300 text-xs max-w-[140px] truncate">{s.customer_name}</td>
                      <td className="px-4 py-3 text-slate-400 tabular">{s.total_deliveries.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-400 tabular">{formatPercent(s.on_time_rate)}</td>
                      <td className="px-4 py-3 text-slate-400 tabular">{formatCurrency(s.total_revenue)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md whitespace-nowrap ${healthStyle[s.sla_health]}`}>
                          {s.sla_health}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Late loads */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <h2 className="text-sm font-semibold text-slate-300 text-wrap-balance">Late Loads (7 Days)</h2>
            {!loading && <span className="ml-auto text-xs text-slate-600 tabular">{atRisk.length}</span>}
          </div>
          <div className="overflow-y-auto max-h-[480px]">
            {loading ? (
              <div className="p-6 space-y-3">
                {[0,1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-lg" />)}
              </div>
            ) : atRisk.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-emerald-400 text-sm font-medium">No late loads</p>
                <p className="text-slate-600 text-xs mt-1">All deliveries on time</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {atRisk.slice(0, 50).map(a => (
                  <div key={a.event_id} className="px-5 py-3 hover:bg-slate-800/30 transition-colors duration-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-slate-300 text-xs font-medium truncate">{a.customer_name}</p>
                        <p className="text-slate-600 text-xs tabular mt-0.5">{a.actual_datetime}</p>
                        <p className="text-slate-600 text-xs mt-0.5">{a.location_city}, {a.location_state}</p>
                      </div>
                      <span className="text-slate-400 text-xs tabular flex-shrink-0">{formatCurrency(a.revenue)}</span>
                    </div>
                  </div>
                ))}
                {atRisk.length > 50 && (
                  <p className="px-5 py-3 text-xs text-slate-600 tabular">+{atRisk.length - 50} more loads</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
