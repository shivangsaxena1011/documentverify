"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  FileBarChart,
  ArrowUpRight,
  Download,
  Printer,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";

export default function ReportsPage() {
  const [screenings, setScreenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/screenings?limit=50")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setScreenings(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Verification Dossiers & Reports
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Official institutional screening assessments, printable dossiers, and exportable records.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-surface-100 border border-border">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              <span>Loading dossiers...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {screenings.map((sc) => (
                <div
                  key={sc.id}
                  className="p-4 rounded-xl bg-surface-200 border border-border/80 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-400 text-xs">
                        {sc.screeningId}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          sc.riskTier === "LOW_RISK"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : sc.riskTier === "REVIEW_REQUIRED"
                            ? "bg-amber-950 text-amber-400 border border-amber-800"
                            : "bg-rose-950 text-rose-400 border border-rose-800"
                        }`}
                      >
                        {sc.riskTier.replace("_", " ")}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-200">
                      {sc.documentType.replace(/_/g, " ")}
                    </h4>

                    <p className="text-[11px] text-slate-400">
                      Operator: {sc.operator?.name || "Operator"} &bull; Score: {sc.riskScore}/100
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(sc.createdAt).toLocaleDateString()}
                    </span>

                    <Link
                      href={`/reports/${sc.screeningId}`}
                      className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Open Dossier</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
