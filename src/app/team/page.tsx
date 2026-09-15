"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Users,
  Shield,
  UserPlus,
  Key,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function TeamPage() {
  const members = [
    {
      name: "Vikramaditya Rao",
      email: "admin@trishul-intel.org",
      role: "ADMINISTRATOR",
      desc: "Full administrative governance, API credential generation, retention management.",
    },
    {
      name: "Dr. Ananya Sen",
      email: "reviewer@trishul-intel.org",
      role: "REVIEWER",
      desc: "Authorized to triage flagged screenings and temporarily unmask sensitive PII.",
    },
    {
      name: "Rajeshwar Chauhan",
      email: "investigator@trishul-intel.org",
      role: "INVESTIGATOR",
      desc: "In-depth forensic anomaly analysis and TRISHUL intelligence handoff operations.",
    },
    {
      name: "Shiva Verma",
      email: "operator@trishul-intel.org",
      role: "OPERATOR",
      desc: "Front-desk document scanning, camera capture, and preliminary verification triage.",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Operational Personnel & Role Access Control
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Role-based authorization hierarchy (RBAC) governing screening access and PII unmasking privileges.
            </p>
          </div>
        </div>

        {/* Roles Permission Matrix Card */}
        <div className="p-6 rounded-2xl bg-surface-100 border border-border space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-2 border-b border-border">
            Institutional Role Permissions Matrix
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-surface-200 border border-border space-y-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                OPERATOR
              </span>
              <p className="text-slate-300 font-semibold mt-1">Verification Desk</p>
              <ul className="text-[11px] text-slate-400 space-y-1">
                <li>&bull; Ingest and scan documents</li>
                <li>&bull; View masked OCR outputs</li>
                <li>&bull; Export basic verification summary</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-surface-200 border border-border space-y-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
                INVESTIGATOR
              </span>
              <p className="text-slate-300 font-semibold mt-1">Forensic Analysis</p>
              <ul className="text-[11px] text-slate-400 space-y-1">
                <li>&bull; Inspect anomaly bounding boxes</li>
                <li>&bull; Biometric similarity matching</li>
                <li>&bull; Dispatch to TRISHUL Hub</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-surface-200 border border-border space-y-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                REVIEWER
              </span>
              <p className="text-slate-300 font-semibold mt-1">Supervisor Triage</p>
              <ul className="text-[11px] text-slate-400 space-y-1">
                <li>&bull; Triage Review-Required cases</li>
                <li>&bull; Authorized PII unmasking</li>
                <li>&bull; Override classification types</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-surface-200 border border-border space-y-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                ADMINISTRATOR
              </span>
              <p className="text-slate-300 font-semibold mt-1">System Governance</p>
              <ul className="text-[11px] text-slate-400 space-y-1">
                <li>&bull; Full system & audit log access</li>
                <li>&bull; Manage API keys & gateways</li>
                <li>&bull; Data retention policy controls</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Members Directory */}
        <div className="p-5 rounded-xl bg-surface-100 border border-border space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-2 border-b border-border">
            Registered Institutional Operators
          </h3>

          <div className="divide-y divide-border/60">
            {members.map((m, idx) => (
              <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{m.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-blue-950 text-blue-400 border border-blue-800">
                      {m.role}
                    </span>
                  </div>
                  <p className="font-mono text-slate-400 text-[11px]">{m.email}</p>
                  <p className="text-slate-500 text-[11px]">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
