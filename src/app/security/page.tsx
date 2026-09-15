"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  ShieldCheck,
  Lock,
  Trash2,
  CheckCircle2,
  Clock,
  FileCheck,
  AlertTriangle,
} from "lucide-react";

export default function SecurityPrivacyPage() {
  const [retentionPolicy, setRetentionPolicy] = useState("30_DAYS");
  const [purgeSessionId, setPurgeSessionId] = useState("");
  const [isPurging, setIsPurging] = useState(false);

  const handleManualPurge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purgeSessionId) return;

    setIsPurging(true);
    try {
      const res = await fetch(`/api/screenings/${purgeSessionId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        alert("Document image payload purged successfully.");
        setPurgeSessionId("");
      } else {
        alert(json.error || "Purge failed.");
      }
    } catch {
      alert("Purge network error.");
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Security Architecture & Data Retention Policy
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-semibold">
                Governance
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Configurable privacy lifecycle controls, ephemeral processing buffers, and on-demand purge tools.
            </p>
          </div>
        </div>

        {/* Core Safeguards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-surface-100 border border-border space-y-2">
            <Lock className="h-5 w-5 text-blue-400 mb-1" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">PII Masking by Default</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              All government identification numbers (Aadhaar, PAN, Passport) are masked at rest and in transit. Viewing unmasked values requires verified supervisor authorization.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-surface-100 border border-border space-y-2">
            <Clock className="h-5 w-5 text-emerald-400 mb-1" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Automated Lifecycle Expiry</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Raw document images reside in ephemeral processing memory and are scheduled for irreversible overwriting once the retention duration concludes.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-surface-100 border border-border space-y-2">
            <FileCheck className="h-5 w-5 text-indigo-400 mb-1" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Tamper-Evident Auditing</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every document ingestion, PII unmasking event, report export, and central TRISHUL transmission is cryptographically hashed to an immutable audit ledger.
            </p>
          </div>
        </div>

        {/* Configurable Retention Policy */}
        <div className="p-6 rounded-2xl bg-surface-100 border border-border space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-2 border-b border-border">
            Organizational Document Image Retention Policy
          </h3>

          <div className="space-y-3 max-w-2xl text-xs">
            <p className="text-slate-400">
              Select how long scanned image payloads are stored before automated cryptographic deletion:
            </p>

            <div className="space-y-2">
              {[
                { value: "INSTANT_PURGE", label: "Instant Ephemeral Purge (Purge immediately after OCR & report synthesis)" },
                { value: "24_HOURS", label: "24 Hours (Recommended for verification desks & hotel check-ins)" },
                { value: "7_DAYS", label: "7 Days (Recommended for financial KYC onboarding triage)" },
                { value: "30_DAYS", label: "30 Days (Standard enterprise security audit window)" },
                { value: "INDEFINITE", label: "Indefinite Archiving (Requires institutional statutory justification)" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    retentionPolicy === opt.value
                      ? "bg-blue-950/40 border-blue-600 text-white"
                      : "bg-surface-200 border-border text-slate-400 hover:bg-surface-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="retention"
                    value={opt.value}
                    checked={retentionPolicy === opt.value}
                    onChange={(e) => setRetentionPolicy(e.target.value)}
                    className="accent-blue-600"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <button
              onClick={() => alert(`Retention policy updated to: ${retentionPolicy}`)}
              className="mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
            >
              Update Retention Policy
            </button>
          </div>
        </div>

        {/* On-Demand Document Purge Tool */}
        <div className="p-6 rounded-2xl bg-surface-100 border border-border space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-rose-400" />
              <span>On-Demand Permanent Document Purge</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Irreversible Action</span>
          </div>

          <form onSubmit={handleManualPurge} className="space-y-3 max-w-xl text-xs">
            <p className="text-slate-400">
              Provide the Screening ID (e.g. <span className="font-mono text-slate-300">TR-2026-89012</span>) to immediately overwrite and delete stored document payloads:
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={purgeSessionId}
                onChange={(e) => setPurgeSessionId(e.target.value)}
                placeholder="TR-2026-XXXXX"
                className="flex-1 px-3 py-2 rounded-lg bg-surface-200 border border-border text-white font-mono focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={isPurging}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors"
              >
                {isPurging ? "Purging..." : "Purge Document"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
