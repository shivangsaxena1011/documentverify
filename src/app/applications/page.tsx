"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileText,
  Building2,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  X,
  FileCheck,
} from "lucide-react";

interface ApplicationItem {
  id: string;
  applicationNumber: string;
  institutionName: string;
  permanentId: string;
  applicationCategory: string;
  academicYear: string;
  previousApprovalRef: string | null;
  terFeeStatus: string;
  approvedIntake: number;
  requestedIntake: number;
  facultyCount: number;
  requiredFacultyCount: number;
  validationStatus: string;
  complianceScore: number;
  lastValidatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    documents: number;
    findings: number;
    sourceChecks: number;
  };
}

interface ApplicationsResponse {
  success: boolean;
  data: ApplicationItem[];
  metrics: {
    total: number;
    pendingValidationCount: number;
    flaggedCount: number;
    readyCount: number;
  };
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    pendingValidationCount: 0,
    flaggedCount: 0,
    readyCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  // Create form state
  const [formData, setFormData] = useState({
    institutionName: "",
    permanentId: "",
    applicationCategory: "EXTENSION_OF_APPROVAL",
    academicYear: "2026-2027",
    previousApprovalRef: "",
    previousApprovalStatus: "APPROVED",
    institutionRecordStatus: "ACTIVE",
    terFeeStatus: "PAID",
    terFeeReference: "",
    approvedIntake: "240",
    requestedIntake: "300",
    facultyCount: "16",
    requiredFacultyCount: "15",
    reviewerNotes: "",
  });

  const loadApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const res = await fetch(`/api/institution-applications?${params.toString()}`);
      const json: ApplicationsResponse = await res.json();
      if (json.success) {
        setApplications(json.data);
        if (json.metrics) setMetrics(json.metrics);
      }
    } catch (err) {
      console.error("Failed to load applications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadApplications();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreateError("");

    try {
      const res = await fetch("/api/institution-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        setFormData({
          institutionName: "",
          permanentId: "",
          applicationCategory: "EXTENSION_OF_APPROVAL",
          academicYear: "2026-2027",
          previousApprovalRef: "",
          previousApprovalStatus: "APPROVED",
          institutionRecordStatus: "ACTIVE",
          terFeeStatus: "PAID",
          terFeeReference: "",
          approvedIntake: "240",
          requestedIntake: "300",
          facultyCount: "16",
          requiredFacultyCount: "15",
          reviewerNotes: "",
        });
        await loadApplications();
      } else {
        setCreateError(json.error || "Failed to create application case");
      }
    } catch {
      setCreateError("Network communication error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "DRAFT":
        return { label: "Draft Intake", color: "bg-slate-800 text-slate-300 border-slate-700" };
      case "VALIDATION_PENDING":
        return { label: "Validation Pending", color: "bg-amber-950 text-amber-400 border-amber-800" };
      case "RECTIFICATION_REQUESTED":
        return { label: "Deficiency Flagged", color: "bg-rose-950 text-rose-400 border-rose-800" };
      case "OFFICIAL_REVIEW_REQUIRED":
        return { label: "Review Required", color: "bg-blue-950 text-blue-400 border-blue-800" };
      case "READY_FOR_OFFICIAL_SCRUTINY":
        return { label: "Ready for Scrutiny", color: "bg-emerald-950 text-emerald-400 border-emerald-800" };
      case "UNDER_REVIEW":
        return { label: "Under Official Review", color: "bg-purple-950 text-purple-400 border-purple-800" };
      case "CLOSED":
        return { label: "Closed", color: "bg-slate-900 text-slate-500 border-slate-800" };
      default:
        return { label: status, color: "bg-slate-800 text-slate-300 border-slate-700" };
    }
  };

  const formatCategory = (cat: string) => {
    switch (cat) {
      case "EXTENSION_OF_APPROVAL":
        return "Extension of Approval (EoA)";
      case "NEW_PROGRAMME":
        return "New Programme / Course";
      case "INTAKE_CHANGE":
        return "Intake Capacity Variation";
      case "APPROVAL_CHANGE":
        return "Approval Modification";
      default:
        return cat.replace(/_/g, " ");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                AICTE PS 26261
              </span>
              <span className="text-xs text-slate-400">Decision Support Architecture</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <GraduationCap className="h-6 w-6 text-blue-400" />
              <span>Institutional Applications & Regulatory Compliance</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              AI-powered document authentication, multi-factor checklist validation, and statutory compliance analysis for AICTE institutional approval cases.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-900/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Institution Application</span>
            </button>
          </div>
        </div>

        {/* Operational KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-surface-100 border border-border">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Total Cases</span>
              <Building2 className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{metrics.total}</div>
            <p className="text-[11px] text-slate-500 mt-1">Persisted institutional dockets</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-100 border border-border">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Validation Pending</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {metrics.pendingValidationCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting checklist execution</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-100 border border-border">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Deficiencies Flagged</span>
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400 font-mono">
              {metrics.flaggedCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Requires applicant rectification</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-100 border border-border">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Ready for Scrutiny</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {metrics.readyCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Statutory norms satisfied</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-xl bg-surface-100 border border-border space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by Institution Name, Permanent ID, or Case Number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-200 border border-border rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </form>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-surface-200 border border-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Application Categories</option>
                <option value="EXTENSION_OF_APPROVAL">Extension of Approval (EoA)</option>
                <option value="NEW_PROGRAMME">New Programme / Course</option>
                <option value="INTAKE_CHANGE">Intake Change</option>
                <option value="APPROVAL_CHANGE">Approval Modification</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-surface-200 border border-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Scrutiny Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="VALIDATION_PENDING">Validation Pending</option>
                <option value="RECTIFICATION_REQUESTED">Deficiency Flagged</option>
                <option value="OFFICIAL_REVIEW_REQUIRED">Review Required</option>
                <option value="READY_FOR_OFFICIAL_SCRUTINY">Ready for Scrutiny</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="CLOSED">Closed</option>
              </select>

              <button
                onClick={loadApplications}
                className="p-2 rounded-lg bg-surface-200 border border-border hover:bg-surface-50 text-slate-400 hover:text-white transition-colors"
                title="Refresh Records"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Applications Data Table */}
        <div className="rounded-xl bg-surface-100 border border-border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-400" />
              <p className="text-xs">Loading institutional dockets...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="inline-flex p-3 rounded-full bg-surface-200 border border-border text-slate-500">
                <FileCheck className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">No Institutional Applications Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No institutional cases match your current filters. Create an application case to begin attaching supporting regulatory evidence and executing compliance checklists.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create Institutional Application</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-200/50 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Case Reference</th>
                    <th className="px-4 py-3">Institution & Code</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Intake & Ratio</th>
                    <th className="px-4 py-3">Evidence Docs</th>
                    <th className="px-4 py-3">Compliance Score</th>
                    <th className="px-4 py-3">Scrutiny Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-slate-300">
                  {applications.map((app) => {
                    const st = formatStatus(app.validationStatus);
                    return (
                      <tr key={app.id} className="hover:bg-surface-50/50 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-medium text-blue-400">
                          {app.applicationNumber}
                          <span className="block text-[10px] font-sans text-slate-500">
                            AY {app.academicYear}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-white">{app.institutionName}</div>
                          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>PID: {app.permanentId}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-500">TER: {app.terFeeStatus}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[11px] text-slate-300">
                            {formatCategory(app.applicationCategory)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-[11px] text-slate-200">
                            {app.approvedIntake} &rarr; <span className="text-blue-400 font-bold">{app.requestedIntake}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Faculty: {app.facultyCount} / {app.requiredFacultyCount} req
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-surface-200 text-slate-300 text-[10px]">
                              {app._count.documents} files
                            </span>
                            {app._count.findings > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-900 text-[10px]">
                                {app._count.findings} rules
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-surface-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  app.complianceScore >= 80
                                    ? "bg-emerald-500"
                                    : app.complianceScore >= 50
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                }`}
                                style={{ width: `${app.complianceScore}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-xs text-white">
                              {app.complianceScore}%
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block">
                            {app.lastValidatedAt ? "Validated" : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.color}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            href={`/applications/${app.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 text-xs font-semibold transition-all"
                          >
                            <span>Open Case</span>
                            <ChevronRight className="h-3 w-3" />
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

        {/* Regulatory Governance Disclaimer Notice */}
        <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40 text-[11px] text-blue-300 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold">Statutory Decision Support Disclaimer:</span> TRISHUL Document Intelligence provides automated preliminary compliance scoring, forensic optical character recognition, and cross-reference verification in adherence with the AICTE Approval Process Handbook (APH 2024-2027). All scoring outputs are advisory decision-support signals. Formal statutory scrutiny and final approval decisions rest strictly with competent AICTE authorities.
          </p>
        </div>
      </div>

      {/* New Application Intake Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-surface-100 border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-200/50">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Register Institutional Application Case
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {createError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-slate-300 font-medium">Institution Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Institute of Technology & Management"
                    value={formData.institutionName}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">AICTE Permanent ID (PID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1-432901928"
                    value={formData.permanentId}
                    onChange={(e) => setFormData({ ...formData, permanentId: e.target.value })}
                    className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Application Category *</label>
                  <select
                    value={formData.applicationCategory}
                    onChange={(e) => setFormData({ ...formData, applicationCategory: e.target.value })}
                    className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="EXTENSION_OF_APPROVAL">Extension of Approval (EoA)</option>
                    <option value="NEW_PROGRAMME">New Programme / Course</option>
                    <option value="INTAKE_CHANGE">Intake Capacity Variation</option>
                    <option value="APPROVAL_CHANGE">Approval Modification</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Academic Year</label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Previous EoA Reference Number</label>
                  <input
                    type="text"
                    placeholder="e.g. F.No. AICTE/AB/2025/1-432901928"
                    value={formData.previousApprovalRef}
                    onChange={(e) => setFormData({ ...formData, previousApprovalRef: e.target.value })}
                    className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">TER Fee Status</label>
                  <select
                    value={formData.terFeeStatus}
                    onChange={(e) => setFormData({ ...formData, terFeeStatus: e.target.value })}
                    className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                    <option value="EXEMPTED">EXEMPTED</option>
                    <option value="DEFICIENT">DEFICIENT</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">TER Transaction Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-AICTE-2026-904128"
                    value={formData.terFeeReference}
                    onChange={(e) => setFormData({ ...formData, terFeeReference: e.target.value })}
                    className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Current Approved Intake</label>
                  <input
                    type="number"
                    value={formData.approvedIntake}
                    onChange={(e) => setFormData({ ...formData, approvedIntake: e.target.value })}
                    className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Requested Student Intake</label>
                  <input
                    type="number"
                    value={formData.requestedIntake}
                    onChange={(e) => setFormData({ ...formData, requestedIntake: e.target.value })}
                    className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Declared Faculty Count</label>
                  <input
                    type="number"
                    value={formData.facultyCount}
                    onChange={(e) => setFormData({ ...formData, facultyCount: e.target.value })}
                    className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Required Faculty (1:20 Norm)</label>
                  <input
                    type="number"
                    value={formData.requiredFacultyCount}
                    onChange={(e) => setFormData({ ...formData, requiredFacultyCount: e.target.value })}
                    className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-slate-300 font-medium">Applicant / Reviewer Intake Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Initial case briefing, regional office notes, or special dispensation..."
                    value={formData.reviewerNotes}
                    onChange={(e) => setFormData({ ...formData, reviewerNotes: e.target.value })}
                    className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-200 hover:bg-surface-50 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Registering Case...</span>
                    </>
                  ) : (
                    <span>Register Case</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
