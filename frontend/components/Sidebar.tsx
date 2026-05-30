"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Wrench, ShieldCheck, TruckIcon, Settings, LayoutDashboard, Bot, ChevronRight } from "lucide-react";

const navItems = [
  { href: "/",            label: "Overview",        icon: LayoutDashboard, accent: "blue"    },
  { href: "/maintenance", label: "Maintenance Hub",  icon: Wrench,          accent: "amber",  badge: "UC1" },
  { href: "/safety",      label: "Safety Command",   icon: ShieldCheck,     accent: "rose",   badge: "UC2" },
  { href: "/delivery",    label: "Delivery SLA",     icon: TruckIcon,       accent: "emerald",badge: "UC3" },
  { href: "/chat",        label: "AI Query",         icon: Bot,             accent: "violet"  },
  { href: "/settings",    label: "Connectors",       icon: Settings,        accent: "slate"   },
];

const accentMap: Record<string, { active: string; dot: string }> = {
  blue:    { active: "text-blue-400",    dot: "bg-blue-400"    },
  amber:   { active: "text-amber-400",   dot: "bg-amber-400"   },
  rose:    { active: "text-rose-400",    dot: "bg-rose-400"    },
  emerald: { active: "text-emerald-400", dot: "bg-emerald-400" },
  violet:  { active: "text-violet-400",  dot: "bg-violet-400"  },
  slate:   { active: "text-slate-300",   dot: "bg-slate-400"   },
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 bg-slate-900 border-r border-slate-800/80 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-md shadow-blue-900/40">
            <Bot className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight tracking-tight">Enterprise RAG</p>
            <p className="text-xs text-slate-500">Industrial AI v2</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 space-y-0.5">
        <p className="px-2.5 text-xs font-semibold text-slate-600 uppercase tracking-widest mb-2.5">
          Modules
        </p>
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const a = accentMap[item.accent];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium",
                "transition-colors duration-150",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-200"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors duration-150",
                  isActive ? a.active : "text-slate-600 group-hover:text-slate-400"
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-mono font-bold tabular",
                  isActive ? "bg-slate-700 text-slate-400" : "bg-slate-800/80 text-slate-600"
                )}>
                  {item.badge}
                </span>
              )}
              {isActive && (
                <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800/80">
        <p className="text-xs font-medium text-slate-600">Enterprise RAG Platform</p>
        <p className="text-xs text-slate-700 mt-0.5">v2.0 · Industrial Automation</p>
      </div>
    </aside>
  );
}
