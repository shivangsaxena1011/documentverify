"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  GraduationCap,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  Play,
  Share2,
  Building2,
  Copy,
  Check,
  Eye,
  FileCheck,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  FileSpreadsheet,
  Download,
} from "lucide-react";

interface ApplicationDetail {
  id: string;
  applicationNumber: string;
  institutionName: string;
  permanentId: string;
  applicationCategory: string;
  academicYear: string;
  previousApprovalRef: string | null;
  previousApprovalStatus: string;
  institutionRecordStatus: string;
  terFeeStatus: string;
  terFeeReference: string | null;
  approvedIntake: number;
  requestedIntake: number;
  facultyCount: number;
  requiredFacultyCount: number;
  infrastructureSubmitted: boolean;
  validationStatus: string;
  complianceScore: number;
  rulesetVersion: string;
  reviewerNotes: string | null;
  lastValidatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  documents: Array<{
    id: string;
    category: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    sha256Hash: string;
    issueDate: string | null;
    expiryDate: string | null;
    issuer: string | null;
    referenceNumber: string | null;
    ocrStatus: string;
    ocrText: string | null;
    ocrConfidence: number | null;
    duplicateOfId: string | null;
    createdAt: string;
  }>;
  findings: Array<{
    id: string;
    ruleId: string;
    ruleSource: string;
    rulesetVersion: string;
    severity: string;
    status: string;
    title: string;
    reason: string;
    documentReference: string | null;
    recommendedNextStep: string;
    createdAt: string;
  }>;
  sourceChecks: Array<{
    id: string;
    sourceProvider: string;
    verificationTarget: string;
    status: string;
    summary: string;
    detailsJson: string | null;
    verifiedBy: string | null;
    verifiedAt: string;
  }>;
  infrastructureReviews: Array<{
    id: string;
    documentId: string | null;
    evidenceType: string;
    observations: string;
    evidenceGaps: string | null;
    reviewStatus: string;
    reviewedAt: string | null;
    createdAt: string;
  }>;
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"findings" | "documents" | "sourceChecks" | "infrastructure" | "workflow">("findings");
  const [isValidating, setIsValidating] = useState(false);
  const [isSourceChecking, setIsSourceChecking] = useState(false);
  const [validationSuccessMsg, setValidationSuccessMsg] = useState("");

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("AFFIDAVIT");
  const [uploadIssuer, setUploadIssuer] = useState("");
  const [uploadRefNumber, setUploadRefNumber] = useState("");
  const [uploadIssueDate, setUploadIssueDate] = useState("");
  const [uploadExpiryDate, setUploadExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewActionType, setReviewActionType] = useState("REQUEST_RECTIFICATION");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Manual source verification modal state
  const [showManualSourceModal, setShowManualSourceModal] = useState(false);
  const [manualSourceTarget, setManualSourceTarget] = useState("INSTITUTION_RECORD");
  const [manualSourceStatus, setManualSourceStatus] = useState("VERIFIED");
  const [manualSourceNotes, setManualSourceNotes] = useState("");
  const [manualSourceSubmitting, setManualSourceSubmitting] = useState(false);

  // Expanded OCR text states
  const [expandedOcr, setExpandedOcr] = useState<Record<string, boolean>>({});
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchApplication = async () => {
    try {
      const res = await fetch(`/api/institution-applications/${id}`);
      const json = await res.json();
      if (json.success) {
        setApplication(json.data);
      }
    } catch (err) {
      console.error("Failed to load application details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchApplication();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setUploadError("File size exceeds maximum permitted limit of 15MB");
      return;
    }

    setSelectedFile(file);
    setUploadError("");

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileBase64) {
      setUploadError("Please select a valid PDF, PNG, or JPG document file");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const res = await fetch(`/api/institution-applications/${id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: uploadCategory,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          fileSize: selectedFile.size,
          base64Data: fileBase64,
          issuer: uploadIssuer || null,
          referenceNumber: uploadRefNumber || null,
          issueDate: uploadIssueDate || null,
          expiryDate: uploadExpiryDate || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowUploadModal(false);
        setSelectedFile(null);
        setFileBase64("");
        setUploadIssuer("");
        setUploadRefNumber("");
        setUploadIssueDate("");
        setUploadExpiryDate("");
        await fetchApplication();
      } else {
        setUploadError(json.error || "Failed to upload document");
      }
    } catch {
      setUploadError("Network communication error during document upload");
    } finally {
      setUploading(false);
    }
  };

  const handleRunValidation = async () => {
    setIsValidating(true);
    setValidationSuccessMsg("");
    try {
      const res = await fetch(`/api/institution-applications/${id}/validate`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setValidationSuccessMsg(
          `Regulatory checklist executed successfully: Score ${json.data.complianceScore}%, ${json.data.passedCount} Passed, ${json.data.failedCount} Failed.`
        );
        await fetchApplication();
        setActiveTab("findings");
      }
    } catch (err) {
      console.error("Validation error", err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSourceCheck = async () => {
    setIsSourceChecking(true);
    try {
      const res = await fetch(`/api/institution-applications/${id}/source-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "ALL" }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchApplication();
        setActiveTab("sourceChecks");
      }
    } catch (err) {
      console.error("Source check error", err);
    } finally {
      setIsSourceChecking(false);
    }
  };

  const handleReviewActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/institution-applications/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: reviewActionType,
          observationNotes: reviewNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowReviewModal(false);
        setReviewNotes("");
        await fetchApplication();
      }
    } catch (err) {
      console.error("Review action error", err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleManualSourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSourceSubmitting(true);
    try {
      const res = await fetch(`/api/institution-applications/${id}/source-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manualDecision: {
            target: manualSourceTarget,
            status: manualSourceStatus,
            notes: manualSourceNotes,
            sourceProvider: "Authorized Official Reviewer Scrutiny",
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowManualSourceModal(false);
        setManualSourceNotes("");
        await fetchApplication();
      }
    } catch (err) {
      console.error("Manual source verification error", err);
    } finally {
      setManualSourceSubmitting(false);
    }
  };

  const handleExportDossier = async () => {
    try {
      const res = await fetch(`/api/institution-applications/${id}/report`);
      const json = await res.json();
      if (json.success) {
        // Download as JSON report or display
        const blob = new Blob([JSON.stringify(json.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${json.data.dossierId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to export dossier", err);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(key);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  if (loading || !application) {
    return (
      <AppShell>
        <div className="p-16 text-center text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-400" />
          <p className="text-sm">Retrieving institutional docket and regulatory evidence...</p>
        </div>
      </AppShell>
    );
  }

  const passedFindings = application.findings.filter((f) => f.status === "PASSED");
  const failedFindings = application.findings.filter((f) => f.status === "FAILED");
  const warningFindings = application.findings.filter((f) => f.status === "WARNING" || f.status === "MANUAL_REVIEW_REQUIRED");

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/applications" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Applications</span>
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-mono font-medium">{application.applicationNumber}</span>
        </div>

        {/* Case Dossier Header */}
        <div className="p-6 rounded-2xl bg-surface-100 border border-border shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  {application.applicationNumber}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-surface-200 text-slate-300 font-medium">
                  {application.applicationCategory.replace(/_/g, " ")}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  AY {application.academicYear}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold border bg-slate-800 text-slate-300 border-slate-700">
                  {application.validationStatus.replace(/_/g, " ")}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {application.institutionName}
              </h1>
              <p className="text-xs font-mono text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                <span>AICTE Permanent ID: <strong className="text-slate-200">{application.permanentId}</strong></span>
                <span>•</span>
                <span>TER Fee: <strong className={application.terFeeStatus === "PAID" ? "text-emerald-400" : "text-amber-400"}>{application.terFeeStatus}</strong></span>
                <span>•</span>
                <span>Intake: <strong className="text-slate-200">{application.approvedIntake} &rarr; {application.requestedIntake}</strong></span>
                <span>•</span>
                <span>Faculty: <strong className="text-slate-200">{application.facultyCount} / {application.requiredFacultyCount}</strong></span>
              </p>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleRunValidation}
                disabled={isValidating}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Play className={`h-3.5 w-3.5 ${isValidating ? "animate-spin" : ""}`} />
                <span>{isValidating ? "Evaluating Rules..." : "Run Validation"}</span>
              </button>

              <button
                onClick={handleSourceCheck}
                disabled={isSourceChecking}
                className="px-3.5 py-2 rounded-lg bg-surface-200 hover:bg-surface-50 text-slate-200 border border-border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSourceChecking ? "animate-spin" : ""}`} />
                <span>External Source Check</span>
              </button>

              <button
                onClick={() => setShowReviewModal(true)}
                className="px-3.5 py-2 rounded-lg bg-surface-200 hover:bg-surface-50 text-slate-200 border border-border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>Reviewer Action</span>
              </button>

              <button
                onClick={handleExportDossier}
                className="px-3.5 py-2 rounded-lg bg-surface-200 hover:bg-surface-50 text-slate-300 border border-border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Export JSON Dossier"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Dossier</span>
              </button>
            </div>
          </div>

          {/* Preliminary Compliance Score & Gauge */}
          <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="p-3 rounded-xl bg-surface-200/50 border border-border flex items-center gap-3.5">
              <div className="relative flex items-center justify-center shrink-0">
                <div
                  className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-mono font-bold text-sm ${
                    application.complianceScore >= 80
                      ? "border-emerald-500 text-emerald-400"
                      : application.complianceScore >= 50
                      ? "border-amber-500 text-amber-400"
                      : "border-rose-500 text-rose-400"
                  }`}
                >
                  {application.complianceScore}%
                </div>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Checklist Score
                </span>
                <span className="text-xs font-bold text-white">
                  {application.complianceScore >= 80
                    ? "Preliminary Compliant"
                    : application.complianceScore >= 50
                    ? "Observations Flagged"
                    : "Deficiencies Detected"}
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">
                  Ruleset: {application.rulesetVersion}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-200/50 border border-border text-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
                Checklist Results
              </span>
              <div className="flex items-center gap-3 font-mono font-bold">
                <span className="text-emerald-400">{passedFindings.length} Passed</span>
                <span className="text-rose-400">{failedFindings.length} Failed</span>
                <span className="text-amber-400">{warningFindings.length} Warning</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                {application.findings.length} total regulatory checks evaluated
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-200/50 border border-border text-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
                Evidence Manifest
              </span>
              <div className="font-mono font-bold text-white">
                {application.documents.length} Supporting Files Uploaded
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                {application.documents.filter((d) => d.duplicateOfId).length > 0
                  ? "Hash collisions detected"
                  : "All document SHA-256 hashes unique"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-200/50 border border-border text-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
                External Source Standing
              </span>
              <div className="font-mono font-bold text-amber-400">
                {application.sourceChecks.length > 0
                  ? `${application.sourceChecks.filter((s) => s.status === "VERIFIED").length} Verified / ${application.sourceChecks.length} Checked`
                  : "Checks Pending"}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                AICTE Registry & Treasury Connectors
              </span>
            </div>
          </div>

          {/* Validation Success Banner */}
          {validationSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{validationSuccessMsg}</span>
              </div>
              <button
                onClick={() => setValidationSuccessMsg("")}
                className="text-emerald-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Workspace Tab Bar */}
        <div className="flex items-center gap-2 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab("findings")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "findings"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Compliance Findings ({application.findings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "documents"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Evidence Documents ({application.documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("sourceChecks")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "sourceChecks"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Issuing Authority Verification ({application.sourceChecks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("infrastructure")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "infrastructure"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Infrastructure Scrutiny ({application.infrastructureReviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("workflow")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "workflow"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Official Scrutiny Workflow</span>
          </button>
        </div>

        {/* Tab 1: Compliance Findings */}
        {activeTab === "findings" && (
          <div className="space-y-4">
            {application.findings.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-surface-100 border border-border space-y-3">
                <ShieldCheck className="h-8 w-8 mx-auto text-slate-500" />
                <h3 className="text-sm font-semibold text-white">No Regulatory Findings Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click the <strong>Run Validation</strong> button above to evaluate this case against AICTE Approval Process Handbook (APH 2024-2027) regulatory checklists.
                </p>
                <button
                  onClick={handleRunValidation}
                  disabled={isValidating}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Execute Validation Engine</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {application.findings.map((f) => {
                  const isFailed = f.status === "FAILED";
                  const isWarning = f.status === "WARNING" || f.status === "MANUAL_REVIEW_REQUIRED";
                  const isPassed = f.status === "PASSED";

                  return (
                    <div
                      key={f.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isFailed
                          ? "bg-rose-950/20 border-rose-900/50"
                          : isWarning
                          ? "bg-amber-950/20 border-amber-900/50"
                          : "bg-surface-100 border-border"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {isFailed ? (
                            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                          ) : isWarning ? (
                            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          )}
                          <h4 className="text-xs font-bold text-white tracking-tight">{f.title}</h4>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              f.severity === "CRITICAL"
                                ? "bg-rose-950 text-rose-300 border border-rose-800"
                                : f.severity === "HIGH"
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : "bg-surface-200 text-slate-300"
                            }`}
                          >
                            {f.severity}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-surface-200 text-slate-300">
                            {f.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed mb-2.5">{f.reason}</p>

                      <div className="pt-2.5 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-400">
                          <strong className="text-slate-300">Statutory Norm:</strong> {f.ruleSource}
                        </span>
                        <span className="text-blue-400 font-medium">
                          Next Step: {f.recommendedNextStep}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Evidence Documents Manifest */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Attached Institutional Evidence</h3>
                <p className="text-xs text-slate-400">
                  Authenticated supporting documents, cryptographic checksums, and OCR telemetry.
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Upload Supporting Document</span>
              </button>
            </div>

            {application.documents.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-surface-100 border border-border space-y-3">
                <UploadCloud className="h-8 w-8 mx-auto text-slate-500" />
                <h3 className="text-sm font-semibold text-white">No Supporting Documents Uploaded</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Upload affidavits, previous approval letters, faculty declarations, and infrastructure evidence to satisfy regulatory checklists.
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload Document</span>
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-surface-100 border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-200/50 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-border">
                      <tr>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">File Name & Size</th>
                        <th className="px-4 py-3">SHA-256 Hash</th>
                        <th className="px-4 py-3">Validity / Dates</th>
                        <th className="px-4 py-3">OCR Extraction</th>
                        <th className="px-4 py-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-slate-300">
                      {application.documents.map((doc) => {
                        const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                        const isDupe = Boolean(doc.duplicateOfId);
                        const isExpanded = Boolean(expandedOcr[doc.id]);

                        return (
                          <React.Fragment key={doc.id}>
                            <tr className="hover:bg-surface-50/50 transition-colors">
                              <td className="px-4 py-3.5">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-200 text-slate-300">
                                  {doc.category.replace(/_/g, " ")}
                                </span>
                                {isDupe && (
                                  <span className="block mt-1 text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> Duplicate Hash
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-semibold text-white">{doc.fileName}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {(doc.fileSize / 1024).toFixed(1)} KB • {doc.mimeType}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 font-mono text-[10px] text-slate-400">
                                <div className="flex items-center gap-1.5">
                                  <span>{doc.sha256Hash.slice(0, 16)}...</span>
                                  <button
                                    onClick={() => copyToClipboard(doc.sha256Hash, doc.id)}
                                    className="p-1 hover:text-white transition-colors"
                                    title="Copy SHA-256 Hash"
                                  >
                                    {copiedHash === doc.id ? (
                                      <Check className="h-3 w-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-[11px]">
                                {doc.expiryDate ? (
                                  <div>
                                    <span className={isExpired ? "text-rose-400 font-semibold" : "text-slate-300"}>
                                      Exp: {doc.expiryDate.split("T")[0]}
                                    </span>
                                    {isExpired && (
                                      <span className="text-[10px] text-rose-400 block font-semibold">
                                        Expired
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-500">Not specified</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    doc.ocrStatus === "EXTRACTED"
                                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                      : "bg-amber-950 text-amber-400 border border-amber-800"
                                  }`}
                                >
                                  {doc.ocrStatus.replace(/_/g, " ")}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                {doc.ocrText && (
                                  <button
                                    onClick={() =>
                                      setExpandedOcr((prev) => ({
                                        ...prev,
                                        [doc.id]: !prev[doc.id],
                                      }))
                                    }
                                    className="p-1.5 rounded-lg bg-surface-200 hover:bg-surface-50 text-slate-300 text-xs inline-flex items-center gap-1 transition-colors"
                                  >
                                    <span>OCR</span>
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                  </button>
                                )}
                              </td>
                            </tr>
                            {isExpanded && doc.ocrText && (
                              <tr className="bg-surface-200/30">
                                <td colSpan={6} className="p-4 text-xs">
                                  <div className="p-3 rounded-lg bg-surface-200 border border-border font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                                    {doc.ocrText}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Issuing Authority Verification */}
        {activeTab === "sourceChecks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">External Authority Verification</h3>
                <p className="text-xs text-slate-400">
                  Issuing-authority adapters, master registry corroboration, and manual reviewer verification logs.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowManualSourceModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-50 text-slate-200 border border-border text-xs font-semibold transition-colors cursor-pointer"
                >
                  Record Manual Verification
                </button>
                <button
                  onClick={handleSourceCheck}
                  disabled={isSourceChecking}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSourceChecking ? "animate-spin" : ""}`} />
                  <span>Execute Gateway Checks</span>
                </button>
              </div>
            </div>

            {application.sourceChecks.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-surface-100 border border-border space-y-3">
                <Building2 className="h-8 w-8 mx-auto text-slate-500" />
                <h3 className="text-sm font-semibold text-white">No External Source Checks Dispatched</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Execute the institutional gateway check to verify standing against the AICTE Central Registry or record manual verification.
                </p>
                <button
                  onClick={handleSourceCheck}
                  disabled={isSourceChecking}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Execute Source Checks</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {application.sourceChecks.map((sc) => (
                  <div key={sc.id} className="p-4 rounded-xl bg-surface-100 border border-border space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-400 shrink-0" />
                        <h4 className="text-xs font-bold text-white">{sc.sourceProvider}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-200 text-slate-300">
                          {sc.verificationTarget}
                        </span>
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          sc.status === "VERIFIED"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : sc.status === "SOURCE_UNAVAILABLE"
                            ? "bg-amber-950 text-amber-400 border border-amber-800"
                            : "bg-rose-950 text-rose-400 border border-rose-800"
                        }`}
                      >
                        {sc.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{sc.summary}</p>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Verified By: {sc.verifiedBy || "SYSTEM_GATEWAY"}</span>
                      <span>{sc.verifiedAt.replace("T", " ").slice(0, 19)} UTC</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Infrastructure Scrutiny */}
        {activeTab === "infrastructure" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Instructional & Physical Infrastructure Scrutiny</h3>
              <p className="text-xs text-slate-400">
                Evaluation of classroom, laboratory, floor plan, and barrier-free facility submissions.
              </p>
            </div>

            {application.infrastructureReviews.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-surface-100 border border-border space-y-3">
                <Layers className="h-8 w-8 mx-auto text-slate-500" />
                <h3 className="text-sm font-semibold text-white">No Infrastructure Evidence Logged</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Upload geo-tagged photographs or floor plan blueprints under category <strong>INFRASTRUCTURE_EVIDENCE</strong> in the Evidence Documents tab.
                </p>
                <button
                  onClick={() => {
                    setUploadCategory("INFRASTRUCTURE_EVIDENCE");
                    setShowUploadModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload Infrastructure Photo</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {application.infrastructureReviews.map((ir) => (
                  <div key={ir.id} className="p-4 rounded-xl bg-surface-100 border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <Layers className="h-4 w-4 text-blue-400" />
                        <span>{ir.evidenceType.replace(/_/g, " ")}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-200 text-slate-300">
                        {ir.reviewStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{ir.observations}</p>
                    {ir.evidenceGaps && (
                      <p className="text-xs text-amber-400">Gaps: {ir.evidenceGaps}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Review Workflow & Audit Log */}
        {activeTab === "workflow" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-100 border border-border space-y-3">
              <h3 className="text-sm font-bold text-white">Reviewer Scrutiny Notes & Status History</h3>
              {application.reviewerNotes ? (
                <div className="p-3 rounded-lg bg-surface-200/50 border border-border text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {application.reviewerNotes}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No reviewer observations recorded yet.</p>
              )}

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-slate-400">Current Status: <strong className="text-white">{application.validationStatus}</strong></span>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Update Scrutiny Status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-surface-100 border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-200/50">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Upload Regulatory Evidence</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
              {uploadError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                  {uploadError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Document Category *</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="AFFIDAVIT">Affidavit / Undertaking</option>
                  <option value="PREVIOUS_EOA">Previous Academic Year EoA Letter</option>
                  <option value="FACULTY_DECLARATION">Faculty Roster Declaration</option>
                  <option value="TER_FEE_RECEIPT">TER Processing Fee Receipt</option>
                  <option value="INFRASTRUCTURE_EVIDENCE">Infrastructure Evidence (Photos/Plans)</option>
                  <option value="NOC_PERMISSION">State Government NoC / Affiliation</option>
                  <option value="LEASE_PROPERTY_EVIDENCE">Land / Property Deed</option>
                  <option value="PROGRAMME_INTAKE_EVIDENCE">Curriculum & Intake Justification</option>
                  <option value="ACCREDITATION_CERTIFICATE">Accreditation Certificate (NBA/NAAC)</option>
                  <option value="OTHER">Other Supporting Document</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Select File (PDF, PNG, JPG &mdash; Max 15MB) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                />
                {selectedFile && (
                  <p className="text-[11px] text-slate-400 font-mono">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Issuing Authority</label>
                  <input
                    type="text"
                    placeholder="e.g. AICTE, State Govt, Bank"
                    value={uploadIssuer}
                    onChange={(e) => setUploadIssuer(e.target.value)}
                    className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Reference Number</label>
                  <input
                    type="text"
                    placeholder="e.g. F.No. / Receipt No."
                    value={uploadRefNumber}
                    onChange={(e) => setUploadRefNumber(e.target.value)}
                    className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Issue Date</label>
                  <input
                    type="date"
                    value={uploadIssueDate}
                    onChange={(e) => setUploadIssueDate(e.target.value)}
                    className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Expiry Date (if any)</label>
                  <input
                    type="date"
                    value={uploadExpiryDate}
                    onChange={(e) => setUploadExpiryDate(e.target.value)}
                    className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-200 hover:bg-surface-50 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Hashing & Storing...</span>
                    </>
                  ) : (
                    <span>Upload & Process Evidence</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviewer Action Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-surface-100 border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-200/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Reviewer Scrutiny Action</h3>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReviewActionSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Scrutiny Action *</label>
                <select
                  value={reviewActionType}
                  onChange={(e) => setReviewActionType(e.target.value)}
                  className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="REQUEST_RECTIFICATION">Request Rectification (Deficiency Flagged)</option>
                  <option value="MARK_UNDER_REVIEW">Mark Under Official Scrutiny Review</option>
                  <option value="ESCALATE_FOR_SCRUTINY">Escalate — Ready for Scrutiny Committee</option>
                  <option value="RECORD_OBSERVATION">Record Observation (Keep Status)</option>
                  <option value="CLOSE_CASE">Administrative Case Closure</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Observations / Deficiency Notice *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail specific observations, missing statutory documents, or reasons for status progression..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-900/50 text-[11px] text-blue-300">
                All status transitions and observations are cryptographically recorded in the immutable audit log with reviewer credentials.
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-200 hover:bg-surface-50 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {reviewSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Submit Review Action</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Source Verification Modal */}
      {showManualSourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-surface-100 border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-200/50">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Record Manual Source Verification</h3>
              </div>
              <button
                onClick={() => setShowManualSourceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualSourceSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Verification Target *</label>
                <select
                  value={manualSourceTarget}
                  onChange={(e) => setManualSourceTarget(e.target.value)}
                  className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="INSTITUTION_RECORD">AICTE Institutional Master Record</option>
                  <option value="TER_PAYMENT">TER Fee Bank Transaction UTR</option>
                  <option value="EOA_RECORD">Previous Academic Year EoA Letter</option>
                  <option value="ACCREDITATION">NBA / NAAC Accreditation Standing</option>
                  <option value="NOC_VERIFICATION">State Government NoC Gazette</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Verification Result *</label>
                <select
                  value={manualSourceStatus}
                  onChange={(e) => setManualSourceStatus(e.target.value)}
                  className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="VERIFIED">VERIFIED (Authenticity Corroborated)</option>
                  <option value="MISMATCH_DETECTED">MISMATCH DETECTED (Discrepancy with Portal Record)</option>
                  <option value="EXPIRED">EXPIRED (Validity Date Elapsed)</option>
                  <option value="MANUAL_REVIEW_REQUIRED">MANUAL REVIEW REQUIRED (Pending Physical Inspection)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Verification Notes / Dispatch Order *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record order number, verification method, portal lookup reference, or inspector notes..."
                  value={manualSourceNotes}
                  onChange={(e) => setManualSourceNotes(e.target.value)}
                  className="w-full bg-surface-200 border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowManualSourceModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-200 hover:bg-surface-50 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSourceSubmitting}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {manualSourceSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Record Verification</span>
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
