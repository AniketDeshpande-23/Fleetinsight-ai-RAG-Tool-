"use client";

import { useEffect, useState } from "react";
import { apiFetch, formatCurrency } from "@/lib/utils";
import { ShieldCheck, Bell, RefreshCw, Users } from "lucide-react";

interface Driver {
  driver_id: string; first_name: string; last_name: string;
  recent_incidents: number; at_fault_count: number; preventable_count: number;
  total_damage: number; on_time_delivery_rate: number;
  compliance_status: "CRITICAL" | "WARNING" | "OK";
  flag_incident_spike: boolean; flag_low_ontime: boolean; flag_at_fault: boolean;
}
interface Metrics { incidents_30d: number; at_fault_30d: number; total_damage_30d: number; critical_drivers: number; warning_drivers: number; active_drivers: number }

const statusStyle: Record<string, string> = {
  CRITICAL: "bg-red-500/10 text-red-400 border border-red-500/25",
  WARNING:  "bg-amber-500/10 text-amber-400 border border-amber-500/25",
  OK:       "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
};

const flagStyle: Record<string, string> = {
  spike: "bg-red-500/15 text-red-400 border border-red-500/20",
  fault: "bg-orange-500/15 text-orange-400 border border-orange-500/20",
  late:  "bg-amber-500/15 text-amber-400 border border-amber-500/20",
};

type FilterType = "ALL" | "CRITICAL" | "WARNING" | "OK";

export default function SafetyPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [alerting, setAlerting] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("ALL");

  const load = () => {
    setLoading(true);
    Promise.all([
      apiFetch<{ data: Driver[] }>("/api/safety/compliance"),
      apiFetch<{ data: Metrics }>("/api/safety/metrics"),
    ])
      .then(([d, m]) => { setDrivers(d.data); setMetrics(m.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const triggerAlert = async () => {
    setAlerting(true); setAlertMsg("");
    try {
      const res = await apiFetch<{ message: string }>("/api/safety/trigger-alert", { method: "POST" });
      setAlertMsg(res.message);
    } catch (e: any) { setAlertMsg(e.message || "Error"); }
    finally { setAlerting(false); }
  };

  const filtered = filter === "ALL" ? drivers : drivers.filter(d => d.compliance_status === filter);
  const filterCounts: Record<FilterType, number> = {
    ALL: drivers.length,
    CRITICAL: metrics?.critical_drivers ?? 0,
    WARNING: metrics?.warning_drivers ?? 0,
    OK: (metrics?.active_drivers ?? 0) - (metrics?.critical_drivers ?? 0) - (metrics?.warning_drivers ?? 0),
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">UC2 · Safety</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight text-wrap-balance">Driver Safety & Compliance</h1>
          <p className="text-slate-400 text-sm mt-1.5 text-wrap-pretty">
            Daily compliance scan · Incident monitoring · Auto-alerts to safety officers · AI4I failure patterns
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={load}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors duration-150 min-h-[40px]">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={triggerAlert} disabled={alerting}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-medium transition-colors duration-150 min-h-[40px]">
            <Bell className="w-4 h-4" />
            {alerting ? "Sending…" : "Send Alert"}
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          {alertMsg}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics ? (
          [
            { label: "Critical Drivers",   value: String(metrics.critical_drivers),               sub: "need immediate review",     hi: metrics.critical_drivers > 0 },
            { label: "Warning Drivers",    value: String(metrics.warning_drivers),                sub: "monitor closely",           hi: false },
            { label: "Incidents (30d)",    value: String(metrics.incidents_30d),                  sub: "from sensor failure data",  hi: false },
            { label: "At-Fault Events",    value: String(metrics.at_fault_30d),                   sub: "preventable incidents",     hi: metrics.at_fault_30d > 0 },
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

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-5">
        {(["ALL", "CRITICAL", "WARNING", "OK"] as FilterType[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 min-h-[32px] ${
              filter === f ? "bg-slate-700 text-white" : "bg-slate-800/60 text-slate-500 hover:text-slate-300"
            }`}>
            {f}
            <span className="ml-1.5 tabular opacity-50">({filterCounts[f]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-300">Active Driver Compliance</h2>
          <span className="ml-auto text-xs text-slate-600 tabular">{filtered.length} drivers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["Driver", "ID", "Incidents", "At-Fault", "Damage", "On-Time %", "Status", "Flags"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [0,1,2,3,4,5].map(i => (
                  <tr key={i} className="border-b border-slate-800/40">
                    {[1,2,3,4,5,6,7,8].map(j => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full rounded" /></td>
                    ))}
                  </tr>
                ))
                : filtered.map(d => (
                  <tr key={d.driver_id} className="border-b border-slate-800/40 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-white font-medium">{d.first_name} {d.last_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{d.driver_id}</td>
                    <td className="px-4 py-3 text-slate-400 tabular">{d.recent_incidents}</td>
                    <td className="px-4 py-3 text-slate-400 tabular">{d.at_fault_count}</td>
                    <td className="px-4 py-3 text-slate-400 tabular">{formatCurrency(d.total_damage)}</td>
                    <td className="px-4 py-3 text-slate-400 tabular">
                      {d.on_time_delivery_rate != null ? `${(d.on_time_delivery_rate * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${statusStyle[d.compliance_status]}`}>
                        {d.compliance_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {d.flag_incident_spike && <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${flagStyle.spike}`}>spike</span>}
                        {d.flag_at_fault       && <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${flagStyle.fault}`}>fault</span>}
                        {d.flag_low_ontime     && <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${flagStyle.late}`}>late</span>}
                      </div>
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
