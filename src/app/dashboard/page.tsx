"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Scan,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight,
  Search,
} from "lucide-react";

interface MetricsData {
  totalScreenings: number;
  todayScreenings: number;
  requiresReviewCount: number;
  flaggedCount: number;
  lowRiskCount: number;
  verifiedRate: number;
  avgProcessingTime: number;
  avgOcrAccuracy: number;
  docDistribution: Record<string, number>;
  systemHealth: {
    ocrEngine: string;
    classifierEngine: string;
    forensicEngine: string;
    biometricsModule: string;
    trishulHubGateway: string;
    verificationGateway: string;
  };
}

interface RecentScreening {
  id: string;
  screeningId: string;
  documentType: string;
  status: string;
  riskScore: number;
  riskTier: string;
  processingTimeMs: number;
  createdAt: string;
  operator: { name: string };
  extractedFields: Array<{ fieldKey: string; maskedValue: string }>;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [recentScreenings, setRecentScreenings] = useState<RecentScreening[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [mRes, sRes] = await Promise.all([
          fetch("/api/metrics"),
          fetch("/api/screenings?limit=5"),
        ]);
        const mData = await mRes.json();
        const sData = await sRes.json();

        if (mData.success) setMetrics(mData.data);
        if (sData.success) setRecentScreenings(sData.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatDocName = (type: string) => {
    return type.replace(/_/g, " ").replace("CARD", "");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header with Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Operational Screening Overview
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live document verification throughput, risk analysis, and subsystem health.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/documents"
              className="px-3.5 py-2 rounded-lg bg-surface-100 hover:bg-surface-50 border border-border text-xs font-semibold text-slate-300 transition-colors"
            >
              Browse All Records
            </Link>
            <Link
              href="/scanner"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-900/30 flex items-center gap-2 transition-all"
            >
              <Scan className="h-4 w-4" />
              <span>New Document Screening</span>
            </Link>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-surface-100 border border-border">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Total Screenings</span>
              <FileText className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {metrics ? metrics.totalScreenings : "-"}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              <span className="text-emerald-400 font-medium">+{metrics?.todayScreenings || 0}</span> completed today
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-100 border border-border">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Verified Compliance Rate</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {metrics ? `${metrics.verifiedRate}%` : "-"}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Low risk statutory conformity
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-100 border border-border">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Review Required</span>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {metrics ? metrics.requiresReviewCount : "-"}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Pending supervisor triage
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-100 border border-border">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Avg. Processing Time</span>
              <Clock className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {metrics ? `${(metrics.avgProcessingTime / 1000).toFixed(2)}s` : "-"}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              OCR accuracy avg: <span className="text-slate-300 font-mono">{metrics?.avgOcrAccuracy || 92}%</span>
            </p>
          </div>
        </div>

        {/* Middle Section: Document Classification Breakdown & System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Distribution Card */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-surface-100 border border-border">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-400" />
                <span>Identity Document Ingestion Distribution</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Statutory Standards</span>
            </div>

            {metrics && (
              <div className="space-y-3.5">
                {[
                  { key: "AADHAAR_CARD", label: "Aadhaar Card (UIDAI)", color: "bg-blue-500" },
                  { key: "PAN_CARD", label: "PAN Card (Income Tax Dept)", color: "bg-indigo-500" },
                  { key: "PASSPORT", label: "Passport (ICAO 9303)", color: "bg-emerald-500" },
                  { key: "DRIVING_LICENCE", label: "Driving Licence (MoRTH)", color: "bg-amber-500" },
                  { key: "VOTER_ID", label: "Voter ID (EPIC / ECI)", color: "bg-purple-500" },
                ].map((doc) => {
                  const count = metrics.docDistribution[doc.key] || 0;
                  const total = metrics.totalScreenings || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={doc.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{doc.label}</span>
                        <span className="text-slate-400 font-mono">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-surface-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${doc.color} transition-all duration-500`}
                          style={{ width: `${Math.max(4, pct)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subsystem Readiness Card */}
          <div className="p-5 rounded-xl bg-surface-100 border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-emerald-400" />
                  <span>Subsystem Connectivity</span>
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-200">
                  <span className="text-slate-300">OCR Extraction Engine</span>
                  <span className="text-[11px] font-mono text-emerald-400 font-medium">Tesseract / Cloud</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-200">
                  <span className="text-slate-300">Classification & Forensics</span>
                  <span className="text-[11px] font-mono text-emerald-400 font-medium">Active (v2.1)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-200">
                  <span className="text-slate-300">Biometric Face Analyzer</span>
                  <span className="text-[11px] font-mono text-emerald-400 font-medium">Operational</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-200">
                  <span className="text-slate-300">TRISHUL Central Hub</span>
                  <span className="text-[11px] font-mono text-blue-400 font-medium">Cryptographically Linked</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-200">
                  <span className="text-slate-300">Govt. Verification Gateway</span>
                  <span className="text-[11px] font-mono text-amber-400 font-medium">Sandbox Mode</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-slate-400">
              <span>Security Audit Integrity</span>
              <span className="text-emerald-400 font-mono">100% Sealed</span>
            </div>
          </div>
        </div>

        {/* Recent Screening Records Table */}
        <div className="p-5 rounded-xl bg-surface-100 border border-border">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Recent Document Screenings
              </h3>
              <p className="text-[11px] text-slate-500">
                Latest identity verifications processed by authorized operators.
              </p>
            </div>
            <Link
              href="/documents"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <span>View All Records</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentScreenings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <p className="text-sm font-semibold text-slate-400">No screening activity yet</p>
              <p className="mt-1">Initiate a scan to begin processing identity documents.</p>
              <Link
                href="/scanner"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-xs"
              >
                <Scan className="h-3.5 w-3.5" /> Launch Scanner
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-slate-400 uppercase font-mono text-[10px]">
                    <th className="pb-2.5">Screening ID</th>
                    <th className="pb-2.5">Document Type</th>
                    <th className="pb-2.5">Protected Identifier</th>
                    <th className="pb-2.5">Risk Tier</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5">Operator</th>
                    <th className="pb-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentScreenings.map((sc) => {
                    const primaryField = sc.extractedFields?.find((f) => f.fieldKey.includes("number") || f.fieldKey.includes("epic"));
                    const maskedId = primaryField?.maskedValue || "Protected";

                    return (
                      <tr key={sc.id} className="hover:bg-surface-200/50 transition-colors">
                        <td className="py-3 font-mono font-bold text-blue-400">
                          {sc.screeningId}
                        </td>
                        <td className="py-3 text-slate-200 font-medium">
                          {formatDocName(sc.documentType)}
                        </td>
                        <td className="py-3 font-mono text-slate-300">
                          {maskedId}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                              sc.riskTier === "LOW_RISK"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : sc.riskTier === "REVIEW_REQUIRED"
                                ? "bg-amber-950 text-amber-400 border border-amber-800"
                                : "bg-rose-950 text-rose-400 border border-rose-800"
                            }`}
                          >
                            Score: {sc.riskScore} &bull; {sc.riskTier.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="text-[11px] font-medium text-slate-300">
                            {sc.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">
                          {sc.operator?.name || "Operator"}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/reports/${sc.screeningId}`}
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                          >
                            <span>Dossier</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
