"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  History,
  Search,
  Filter,
  Shield,
  Clock,
  RefreshCw,
  Lock,
} from "lucide-react";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (actionFilter !== "ALL") params.set("action", actionFilter);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Security & Operational Audit Trail
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                Tamper Evident
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable operational event stream recording screenings, PII unmasking, and TRISHUL transmissions.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-xl bg-surface-100 border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit actions, operators, or resource IDs..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-200 border border-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-200 border border-border text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="SCREENING_PROCESSED">Screening Ingestion</option>
              <option value="SENSITIVE_PII_UNMASKED">Sensitive PII Unmasked</option>
              <option value="DOCUMENT_IMAGE_PURGED">Document Purged</option>
              <option value="TRISHUL_INTELLIGENCE_DISPATCHED">TRISHUL Dispatches</option>
            </select>

            <button
              onClick={fetchLogs}
              className="p-2 rounded-lg bg-surface-200 hover:bg-surface-50 border border-border text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="p-5 rounded-xl bg-surface-100 border border-border">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Querying security audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">No matching audit logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-slate-400 uppercase font-mono text-[10px]">
                    <th className="pb-2.5">Timestamp</th>
                    <th className="pb-2.5">Action Event</th>
                    <th className="pb-2.5">Actor / Operator</th>
                    <th className="pb-2.5">Resource Target</th>
                    <th className="pb-2.5">Operational Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-200/50 transition-colors">
                      <td className="py-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                            log.action.includes("UNMASK")
                              ? "bg-amber-950 text-amber-400 border border-amber-800"
                              : log.action.includes("PURGE")
                              ? "bg-rose-950 text-rose-400 border border-rose-800"
                              : "bg-blue-950 text-blue-400 border border-blue-800"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 font-mono text-[11px]">
                        {log.userEmail || "System"}
                      </td>
                      <td className="py-3 text-slate-400 font-mono text-[11px]">
                        {log.resourceId || "-"}
                      </td>
                      <td className="py-3 text-slate-400 text-[11px] max-w-md truncate">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
