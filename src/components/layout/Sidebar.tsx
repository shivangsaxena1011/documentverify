"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Scan,
  Files,
  CheckSquare,
  FileBarChart,
  History,
  Network,
  Key,
  Users,
  Settings,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

export function Sidebar() {
  const pathname = usePathname();

  const mainNav: NavItem[] = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "New Screening", href: "/scanner", icon: Scan, badge: "Live" },
    { label: "Documents", href: "/documents", icon: Files },
    { label: "Verification", href: "/verification", icon: CheckSquare },
    { label: "Reports", href: "/reports", icon: FileBarChart },
    { label: "Activity Logs", href: "/activity", icon: History },
  ];

  const adminNav: NavItem[] = [
    { label: "Integrations", href: "/integrations", icon: Network, badge: "TRISHUL" },
    { label: "API Access", href: "/api-access", icon: Key },
    { label: "Team & Roles", href: "/team", icon: Users },
    { label: "Security & Privacy", href: "/security", icon: ShieldCheck },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-surface-200/50 hidden md:flex flex-col justify-between min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-6">
        {/* Screening Operations Group */}
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Operations
          </p>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-600/15 text-blue-400 border border-blue-600/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-surface-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                        item.badge === "Live"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-blue-950 text-blue-400 border border-blue-800"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Administration & Governance */}
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Governance & Integrations
          </p>
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-600/15 text-blue-400 border border-blue-600/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-surface-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-blue-950 text-blue-400 border border-blue-800">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Hub Status Badge */}
      <div className="p-3 rounded-xl bg-surface-100 border border-border text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-semibold text-slate-300">TRISHUL Hub Active</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">v1.0.4</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Evidence records cryptographically linked to central analysis cluster.
        </p>
      </div>
    </aside>
  );
}
