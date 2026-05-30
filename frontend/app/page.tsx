"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, formatCurrency, formatPercent } from "@/lib/utils";
import { Wrench, ShieldCheck, TruckIcon, ArrowRight, Activity, AlertTriangle } from "lucide-react";

interface MaintenanceMetrics { high_risk_trucks: number; total_cost_30d: number; fleet_total: number }
interface SafetyMetrics { critical_drivers: number; incidents_30d: number; active_drivers: number }
interface DeliveryMetrics { overall_on_time_rate: number; breached_customers: number; late_loads_7d: number }

const colorMap = {
  amber: {
    bg: "bg-amber-500/8",
    border: "border-amber-500/20",
    icon: "text-amber-400",
    iconBg: "bg-amber-500/10 border border-amber-500/20",
    badge: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
    glow: "hover:border-amber-500/40 hover:bg-amber-500/10",
    arrow: "text-amber-400",
  },
  rose: {
    bg: "bg-rose-500/8",
    border: "border-rose-500/20",
    icon: "text-rose-400",
    iconBg: "bg-rose-500/10 border border-rose-500/20",
    badge: "bg-rose-500/15 text-rose-300 border border-rose-500/20",
    glow: "hover:border-rose-500/40 hover:bg-rose-500/10",
    arrow: "text-rose-400",
  },
  emerald: {
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/20",
    icon: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border border-emerald-500/20",
    badge: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
    glow: "hover:border-emerald-500/40 hover:bg-emerald-500/10",
    arrow: "text-emerald-400",
  },
};

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
      <div className="flex justify-between">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="skeleton w-16 h-5 rounded-full" />
      </div>
      <div className="skeleton w-40 h-5 rounded" />
      <div className="skeleton w-full h-12 rounded" />
      <div className="skeleton w-32 h-4 rounded" />
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1 text-wrap-balance">{label}</p>
      <p className="text-2xl font-bold text-white tabular leading-tight">{value}</p>
      <p className="text-xs text-slate-600 mt-1">{sub}</p>
    </div>
  );
}

export default function OverviewPage() {
  const [maint, setMaint] = useState<MaintenanceMetrics | null>(null);
  const [safety, setSafety] = useState<SafetyMetrics | null>(null);
  const [delivery, setDelivery] = useState<DeliveryMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: MaintenanceMetrics }>("/api/maintenance/metrics"),
      apiFetch<{ data: SafetyMetrics }>("/api/safety/metrics"),
      apiFetch<{ data: DeliveryMetrics }>("/api/delivery/metrics"),
    ])
      .then(([m, s, d]) => { setMaint(m.data); setSafety(s.data); setDelivery(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      href: "/maintenance", title: "Predictive Maintenance", sub: "UC1 · Fleet Operations",
      icon: Wrench, color: "amber" as const,
      desc: "AI-scored truck health risk. Daily alerts to maintenance team when trucks reach HIGH risk threshold.",
      stat: maint ? `${maint.high_risk_trucks} / ${maint.fleet_total} high-risk trucks` : null,
    },
    {
      href: "/safety", title: "Safety & Compliance", sub: "UC2 · Driver Command",
      icon: ShieldCheck, color: "rose" as const,
      desc: "Daily compliance scan. Flags drivers with incident spikes or low on-time rates. Auto-alerts safety officers.",
      stat: safety ? `${safety.critical_drivers} critical · ${safety.incidents_30d} incidents (30d)` : null,
    },
    {
      href: "/delivery", title: "Delivery SLA Intelligence", sub: "UC3 · Customer Ops",
      icon: TruckIcon, color: "emerald" as const,
      desc: "Weekly SLA reports by customer. Detects at-risk loads in real time. Auto-sends intelligence emails.",
      stat: delivery ? `${formatPercent(delivery.overall_on_time_rate)} on-time · ${delivery.late_loads_7d.toLocaleString()} late (7d)` : null,
    },
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5" />
            Live Operations
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight text-wrap-balance">
          Industrial Automation Platform
        </h1>
        <p className="text-slate-400 mt-2 text-sm max-w-2xl text-wrap-pretty">
          Three automated intelligence workflows — predictive maintenance, driver safety compliance, and customer delivery SLA — powered by real-time AI analysis.
        </p>
      </div>

      {/* Use-case cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {loading
          ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
          : cards.map((card) => {
              const Icon = card.icon;
              const c = colorMap[card.color];
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className={`group block rounded-2xl border ${c.border} ${c.bg} p-6 ${c.glow} transition-colors duration-200`}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${c.icon}`} />
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.badge}`}>
                      {card.sub.split(" · ")[0]}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold text-base mb-1.5 text-wrap-balance">{card.title}</h3>
                  <p className="text-slate-400 text-sm mb-5 leading-relaxed text-wrap-pretty">{card.desc}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
                    <span className="text-xs text-slate-500 tabular">{card.stat ?? "Loading…"}</span>
                    <ArrowRight className={`w-4 h-4 ${c.arrow} transition-transform duration-150 group-hover:translate-x-0.5`} />
                  </div>
                </Link>
              );
            })}
      </div>

      {/* Snapshot */}
      {!loading && maint && safety && delivery && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h2 className="text-sm font-semibold text-slate-200">Fleet Health Snapshot</h2>
            <span className="ml-auto text-xs text-slate-600">Last 30 days · real data</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="High-Risk Trucks"      value={String(maint.high_risk_trucks)}              sub="need immediate service" />
            <StatCard label="Maintenance Cost"       value={formatCurrency(maint.total_cost_30d)}        sub="30-day window" />
            <StatCard label="Critical Drivers"       value={String(safety.critical_drivers)}             sub="compliance issues" />
            <StatCard label="On-Time Delivery Rate"  value={formatPercent(delivery.overall_on_time_rate)} sub="last 30 days" />
          </div>
        </div>
      )}
    </div>
  );
}
