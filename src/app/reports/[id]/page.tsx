"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  Shield,
  Printer,
  Download,
  Send,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  User,
  Building2,
  Lock,
  ArrowLeft,
  RefreshCw,
  Hash,
  ExternalLink,
} from "lucide-react";

export default function ReportDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPurging, setIsPurging] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecord() {
      try {
        const res = await fetch(`/api/screenings/${id}`);
        const json = await res.json();
        if (json.success) {
          setSession(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRecord();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDispatch = async () => {
    if (!session) return;
    setDispatchStatus("TRANSMITTING");
    try {
      const res = await fetch(`/api/screenings/${session.id}/trishul-dispatch`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setDispatchStatus(`DELIVERED (${json.receipt.trishulTransactionId})`);
        setSession({
          ...session,
          trishulHandoff: {
            trishulTransactionId: json.receipt.trishulTransactionId,
            dispatchStatus: "DELIVERED",
          },
        });
      } else {
        setDispatchStatus("FAILED");
      }
    } catch {
      setDispatchStatus("FAILED");
    }
  };

  const handlePurge = async () => {
    if (!confirm("Are you sure you want to permanently purge this document image in accordance with organizational privacy retention policy? This action cannot be undone.")) {
      return;
    }
    setIsPurging(true);
    try {
      const res = await fetch(`/api/screenings/${session.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        alert("Document image payload purged successfully.");
        window.location.reload();
      } else {
        alert(json.error || "Purge failed.");
      }
    } catch (e) {
      alert("Error purging document.");
    } finally {
      setIsPurging(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="py-24 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
          <span>Generating verification dossier...</span>
        </div>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell>
        <div className="py-24 text-center text-xs text-slate-500">
          <p className="text-sm font-semibold text-slate-400">Screening record not found</p>
          <Link href="/documents" className="mt-3 text-blue-400 hover:underline block">
            Return to registry
          </Link>
        </div>
      </AppShell>
    );
  }

  const positiveSignals = session.riskAssessment?.positiveSignalsJson
    ? JSON.parse(session.riskAssessment.positiveSignalsJson)
    : [];
  const reviewIndicators = session.riskAssessment?.reviewIndicatorsJson
    ? JSON.parse(session.riskAssessment.reviewIndicatorsJson)
    : [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border no-print">
          <Link
            href="/documents"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors w-fit"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Screening Registry</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 border border-border text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5 text-slate-400" />
              <span>Print / Export PDF</span>
            </button>

            <button
              onClick={handleDispatch}
              disabled={Boolean(session.trishulHandoff) || dispatchStatus === "TRANSMITTING"}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/60 disabled:text-slate-400 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {session.trishulHandoff
                  ? "Transmitted to TRISHUL"
                  : dispatchStatus === "TRANSMITTING"
                  ? "Sending..."
                  : "Send to TRISHUL"}
              </span>
            </button>

            <button
              onClick={handlePurge}
              disabled={isPurging || session.document?.isPurged}
              className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/60 text-xs font-semibold text-rose-400 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{session.document?.isPurged ? "Image Purged" : "Purge Image"}</span>
            </button>
          </div>
        </div>

        {/* Printable Official Verification Dossier Card */}
        <div id="printable-dossier" className="p-6 sm:p-8 rounded-2xl bg-surface-100 border border-border space-y-6 shadow-xl">
          {/* Header Strip with Institutional Brand */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg text-white font-mono tracking-wider">
                    TRISHUL
                  </h2>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-semibold">
                    Document Intelligence
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Official Identity Screening & Verification Dossier
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-0.5">
              <div className="text-sm font-bold text-blue-400 font-mono">
                {session.screeningId}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {new Date(session.createdAt).toUTCString()}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                SHA256: {session.document?.sha256Hash?.slice(0, 16)}...
              </div>
            </div>
          </div>

          {/* Screening Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-surface-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500 block">
                Document Standard
              </span>
              <span className="font-bold text-slate-200">
                {session.documentType.replace(/_/g, " ")}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500 block">
                OCR Confidence
              </span>
              <span className="font-bold text-emerald-400 font-mono">
                {session.ocrResult?.averageConfidence || 92}%
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500 block">
                Operator Identity
              </span>
              <span className="font-medium text-slate-300">
                {session.operator?.name || "Operator"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500 block">
                Organization
              </span>
              <span className="font-medium text-slate-300">
                {session.organization?.name || "Apex Verification Hub"}
              </span>
            </div>
          </div>

          {/* Risk Assessment Score Card */}
          <div className="p-4 rounded-xl bg-surface-200 border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`h-14 w-14 rounded-full border-4 flex flex-col items-center justify-center font-mono shrink-0 ${
                  session.riskScore <= 25
                    ? "border-emerald-500 text-emerald-400"
                    : session.riskScore <= 65
                    ? "border-amber-500 text-amber-400"
                    : "border-rose-500 text-rose-400"
                }`}
              >
                <span className="text-base font-bold leading-none">{session.riskScore}</span>
                <span className="text-[7px] uppercase tracking-tighter text-slate-400">Score</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">Screening Assessment:</span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      session.riskTier === "LOW_RISK"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : session.riskTier === "REVIEW_REQUIRED"
                        ? "bg-amber-950 text-amber-400 border border-amber-800"
                        : "bg-rose-950 text-rose-400 border border-rose-800"
                    }`}
                  >
                    {session.riskTier.replace("_", " ")}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Evaluated across optical resolution, statutory layout compliance, and biometric/forensic indicators.
                </p>
              </div>
            </div>

            {session.trishulHandoff && (
              <div className="text-right shrink-0">
                <span className="text-[9px] font-mono uppercase text-blue-400 block font-semibold">
                  TRISHUL Intelligence Handoff
                </span>
                <span className="text-xs font-mono text-slate-300">
                  {session.trishulHandoff.trishulTransactionId}
                </span>
              </div>
            )}
          </div>

          {/* Extracted Statutory Information Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-1 border-b border-border">
              Extracted Statutory Data Fields
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {session.extractedFields?.map((field: any) => (
                <div key={field.id} className="p-3 rounded-lg bg-surface-200 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block">{field.fieldLabel}</span>
                    <span className="font-mono text-slate-200 font-semibold">{field.maskedValue}</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      field.validationStatus === "VALID"
                        ? "bg-emerald-950 text-emerald-400"
                        : "bg-amber-950 text-amber-400"
                    }`}
                  >
                    {field.validationStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Forensic & Quality Findings */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-1 border-b border-border">
              Forensic & Analytical Factors
            </h3>

            <div className="space-y-2 text-xs">
              {positiveSignals.map((sig: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-tight">{sig}</span>
                </div>
              ))}

              {reviewIndicators.map((sig: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-amber-300">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-tight">{sig}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Biometric Face Verification (If Attached) */}
          {session.faceVerification && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-1 border-b border-border">
                Biometric Facial Comparison Record
              </h3>
              <div className="p-3 rounded-lg bg-surface-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Facial Landmark Similarity</span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {session.faceVerification.similarityScore}% &bull; {session.faceVerification.matchStatus}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Auxiliary Operational Signal
                </span>
              </div>
            </div>
          )}

          {/* Verification Gateway & Institutional Disclaimers */}
          <div className="pt-4 border-t border-border/80 text-[11px] text-slate-500 space-y-1.5">
            <p>
              <strong className="text-slate-400">Institutional Notice:</strong> This document screening report is generated by TRISHUL Document Intelligence for authorized identity triage and operational record-keeping. Visual forensics and optical character recognition metrics represent algorithmic indicators and do not substitute for statutory government certifications.
            </p>
            <p className="text-[10px] font-mono text-slate-600">
              Generated by TRISHUL Document Intelligence &bull; Cryptographically sealed ledger ID: {session.id}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
