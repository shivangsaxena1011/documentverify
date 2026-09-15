"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  User,
  LogOut,
  Scan,
  Radio,
  ExternalLink,
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  role: string;
  organization: {
    name: string;
    code: string;
  };
}

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile>({
    name: "Shiva Verma",
    email: "operator@trishul-intel.org",
    role: "OPERATOR",
    organization: {
      name: "Apex Verification Hub",
      code: "APEX-VERIF-HQ-09",
    },
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [statusHover, setStatusHover] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleSwitchRole = async (newRole: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, roleOverride: newRole }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const notifications = [
    {
      id: "1",
      title: "Screening Completed",
      desc: "Aadhaar Card screening TR-2026-89012 verified as Low Risk.",
      time: "4m ago",
      type: "success",
    },
    {
      id: "2",
      title: "Review Required",
      desc: "Passport screening TR-2026-89041 flagged for MRZ check digit discrepancy.",
      time: "28m ago",
      type: "warning",
    },
    {
      id: "3",
      title: "TRISHUL Hub Sync",
      desc: "Cryptographic evidence ledger synchronized with Central Platform.",
      time: "1h ago",
      type: "info",
    },
  ];

  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-md shadow-blue-900/40">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-wider text-base text-white font-mono">
                  TRISHUL
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60 tracking-wider">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-tight -mt-0.5">
                Document Intelligence Platform
              </p>
            </div>
          </Link>

          {/* Org Division Pill */}
          <div className="hidden lg:flex items-center pl-4 border-l border-border/80">
            <span className="text-xs text-slate-400 font-medium truncate max-w-xs">
              {user.organization?.name || "Apex Verification Hub"}
            </span>
          </div>
        </div>

        {/* Right: Status, Actions, User Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Operational System Health Pill */}
          <div
            className="relative hidden sm:block"
            onMouseEnter={() => setStatusHover(true)}
            onMouseLeave={() => setStatusHover(false)}
          >
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-400 font-medium cursor-pointer">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>System Operational</span>
            </div>

            {statusHover && (
              <div className="absolute right-0 mt-2 w-72 p-3 bg-surface-100 border border-border rounded-lg shadow-xl text-xs space-y-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-1.5 border-b border-border text-slate-300 font-semibold">
                  <span>Subsystem Status</span>
                  <span className="text-[10px] text-slate-500 font-mono">Real-time</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-emerald-400" /> OCR Engine
                  </span>
                  <span className="text-emerald-400 text-[11px] font-mono">Active (Tesseract/Cloud)</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-emerald-400" /> Risk Assessment
                  </span>
                  <span className="text-emerald-400 text-[11px] font-mono">Online</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-blue-400" /> TRISHUL Hub
                  </span>
                  <span className="text-blue-400 text-[11px] font-mono">Connected</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-amber-400" /> Verification Gateway
                  </span>
                  <span className="text-amber-400 text-[11px] font-mono">Institutional Sandbox</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Scanner Shortcut */}
          <Link
            href="/scanner"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Scan className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Screening</span>
          </Link>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-50 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-background"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 p-3 bg-surface-100 border border-border rounded-xl shadow-2xl z-50 animate-in fade-in duration-100">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                  <h4 className="text-xs font-semibold text-slate-200">Operational Notifications</h4>
                  <span className="text-[10px] text-blue-400 font-medium cursor-pointer">Mark all read</span>
                </div>
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2 rounded-lg bg-surface-200 hover:bg-surface-50 text-xs transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-200">{n.title}</span>
                        <span className="text-[10px] text-slate-500">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{n.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 pt-2 border-t border-border text-center">
                  <Link
                    href="/activity"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    View complete activity audit log <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Account Menu & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-50 text-left transition-colors"
            >
              <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
                {user.name.charAt(0)}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-slate-200 leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{user.role}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 hidden md:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 p-2 bg-surface-100 border border-border rounded-xl shadow-2xl z-50 animate-in fade-in duration-100">
                <div className="p-2 border-b border-border">
                  <p className="text-xs font-bold text-slate-200">{user.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-blue-950 text-blue-400 border border-blue-800">
                      {user.role}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono truncate">
                      {user.organization?.code}
                    </span>
                  </div>
                </div>

                {/* Role Switcher for Institutional Testing */}
                <div className="p-2 border-b border-border">
                  <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 mb-1.5">
                    Simulate Access Role
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {(["OPERATOR", "INVESTIGATOR", "REVIEWER", "ADMINISTRATOR"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          handleSwitchRole(r);
                          setShowUserMenu(false);
                        }}
                        className={`text-[10px] font-mono px-2 py-1 rounded text-left transition-colors ${
                          user.role === r
                            ? "bg-blue-600 text-white font-bold"
                            : "text-slate-400 hover:text-slate-200 hover:bg-surface-50"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-1">
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-surface-50 transition-colors"
                  >
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>Organization Settings</span>
                  </Link>
                  <button
                    onClick={async () => {
                      await fetch("/api/auth/logout", { method: "POST" });
                      window.location.href = "/";
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
