"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Search,
  Filter,
  ArrowUpRight,
  Scan,
  RefreshCw,
  FileText,
  Calendar,
  Layers,
} from "lucide-react";

export default function DocumentsPage() {
  const [screenings, setScreenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (docTypeFilter !== "ALL") params.set("documentType", docTypeFilter);
      if (riskFilter !== "ALL") params.set("riskTier", riskFilter);

      const res = await fetch(`/api/screenings?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setScreenings(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [docTypeFilter, riskFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  const formatDocName = (type: string) => {
    return type.replace(/_/g, " ").replace("CARD", "");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Screening Records Registry
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical identity document verifications, risk assessments, and forensic dossiers.
            </p>
          </div>

          <Link
            href="/scanner"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-900/30 flex items-center gap-2 transition-all w-fit"
          >
            <Scan className="h-4 w-4" />
            <span>New Screening</span>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-xl bg-surface-100 border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Screening ID or document metadata..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-200 border border-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </form>

          <div className="flex items-center gap-2">
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-200 border border-border text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Documents</option>
              <option value="AADHAAR_CARD">Aadhaar Card</option>
              <option value="PAN_CARD">PAN Card</option>
              <option value="PASSPORT">Passport</option>
              <option value="DRIVING_LICENCE">Driving Licence</option>
              <option value="VOTER_ID">Voter ID</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-200 border border-border text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="LOW_RISK">Low Risk</option>
              <option value="REVIEW_REQUIRED">Review Required</option>
              <option value="HIGH_RISK">High Risk</option>
            </select>

            <button
              onClick={fetchRecords}
              className="p-2 rounded-lg bg-surface-200 hover:bg-surface-50 border border-border text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Screening Table */}
        <div className="p-5 rounded-xl bg-surface-100 border border-border">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              <span>Querying operational database...</span>
            </div>
          ) : screenings.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              <p className="text-sm font-semibold text-slate-400">No matching screening records found</p>
              <p className="mt-1">Adjust your search parameters or run a new document scan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-slate-400 uppercase font-mono text-[10px]">
                    <th className="pb-3">Screening ID</th>
                    <th className="pb-3">Document Type</th>
                    <th className="pb-3">Protected Identifier</th>
                    <th className="pb-3">Risk Assessment</th>
                    <th className="pb-3">Operator</th>
                    <th className="pb-3">Date & Time</th>
                    <th className="pb-3 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {screenings.map((sc) => {
                    const primaryField = sc.extractedFields?.find(
                      (f: any) => f.fieldKey.includes("number") || f.fieldKey.includes("epic")
                    );
                    const maskedId = primaryField?.maskedValue || "Masked Entity";

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
                        <td className="py-3 text-slate-400">
                          {sc.operator?.name || "Operator"}
                        </td>
                        <td className="py-3 text-slate-500 font-mono text-[11px]">
                          {new Date(sc.createdAt).toLocaleString("en-IN", {
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/reports/${sc.screeningId}`}
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold"
                          >
                            <span>Inspect</span>
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
