"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Settings,
  Building2,
  Cpu,
  Sliders,
  Check,
  Shield,
} from "lucide-react";

export default function SettingsPage() {
  const [orgName, setOrgName] = useState("Apex Verification & Identity Operations Hub");
  const [orgCode, setOrgCode] = useState("APEX-VERIF-HQ-09");
  const [ocrProvider, setOcrProvider] = useState("TESSERACT");
  const [lowRiskThreshold, setLowRiskThreshold] = useState("25");
  const [highRiskThreshold, setHighRiskThreshold] = useState("65");
  const [allowPiiUnmask, setAllowPiiUnmask] = useState(true);
  const [enableBiometrics, setEnableBiometrics] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Organization & Screening Preferences
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure institutional entity profile, OCR engine providers, and operational risk thresholds.
            </p>
          </div>
        </div>

        {saved && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <Check className="h-4 w-4" />
            <span>Organization preferences saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Institutional Entity Profile */}
          <div className="p-6 rounded-2xl bg-surface-100 border border-border space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-2 border-b border-border flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-400" />
              <span>Institutional Entity Profile</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Organization Legal Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-border text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Authority Code (TRISHUL Link)
                </label>
                <input
                  type="text"
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-border text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Engine & Provider Abstraction Settings */}
          <div className="p-6 rounded-2xl bg-surface-100 border border-border space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-2 border-b border-border flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-400" />
              <span>Optical Character Recognition (OCR) Engine</span>
            </h3>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400">
                Select the primary character recognition provider. Fallback to Tesseract local occurs automatically if cloud APIs fail:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "TESSERACT", name: "Tesseract Local", note: "Air-gapped / High Privacy" },
                  { id: "GOOGLE_CLOUD_VISION", name: "Google Cloud Vision", note: "Cloud Neural API" },
                  { id: "AZURE_DOC_AI", name: "Azure Doc Intelligence", note: "Enterprise Cloud" },
                ].map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setOcrProvider(p.id)}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      ocrProvider === p.id
                        ? "bg-blue-950/40 border-blue-600 text-white"
                        : "bg-surface-200 border-border text-slate-400 hover:bg-surface-50"
                    }`}
                  >
                    <span className="font-bold block text-xs">{p.name}</span>
                    <span className="text-[10px] text-slate-500">{p.note}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Scoring Thresholds */}
          <div className="p-6 rounded-2xl bg-surface-100 border border-border space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-2 border-b border-border flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" />
              <span>Risk Scoring Thresholds</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Low Risk Maximum Threshold (0 - 100)
                </label>
                <input
                  type="number"
                  value={lowRiskThreshold}
                  onChange={(e) => setLowRiskThreshold(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-border text-white font-mono focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Scores equal or below this value pass as Low Risk.
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  High Risk Trigger Threshold (0 - 100)
                </label>
                <input
                  type="number"
                  value={highRiskThreshold}
                  onChange={(e) => setHighRiskThreshold(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-border text-white font-mono focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Scores equal or above this value trigger Flagged High Risk state.
                </span>
              </div>
            </div>
          </div>

          {/* Security & Verification Toggles */}
          <div className="p-6 rounded-2xl bg-surface-100 border border-border space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-2 border-b border-border">
              Security Governance Toggles
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl bg-surface-200 cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-200 block">Allow PII Unmasking for Reviewers</span>
                  <span className="text-[11px] text-slate-400">
                    Mandatory audit justification required when unmasking Aadhaar/PAN
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowPiiUnmask}
                  onChange={(e) => setAllowPiiUnmask(e.target.checked)}
                  className="h-4 w-4 accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-surface-200 cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-200 block">Enable Biometric Facial Verification</span>
                  <span className="text-[11px] text-slate-400">
                    Allows side-by-side portrait vs live selfie comparison in the screening station
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={enableBiometrics}
                  onChange={(e) => setEnableBiometrics(e.target.checked)}
                  className="h-4 w-4 accent-blue-600 rounded"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
            >
              Save Organization Settings
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
