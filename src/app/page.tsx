"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Scan,
  CheckCircle2,
  Lock,
  ArrowRight,
  FileText,
  Eye,
  Server,
  Fingerprint,
  ChevronRight,
  Database,
  Building2,
  FileCheck,
  Search,
} from "lucide-react";

export default function LandingPage() {
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("OPERATOR");
  const [emailInput, setEmailInput] = useState("operator@trishul-intel.org");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          roleOverride: selectedRole,
        }),
      });
      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        alert("Authentication failed. Please verify institutional credentials.");
      }
    } catch {
      alert("Sign in network error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Enterprise Top Navigation */}
      <header className="border-b border-border/70 bg-background/90 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/40">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold font-mono tracking-wider text-base text-white">TRISHUL</span>
              <span className="text-slate-400 text-xs block -mt-1 font-medium">Document Intelligence</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-7 text-xs font-medium text-slate-300">
            <Link href="#platform" className="hover:text-white transition-colors">Platform</Link>
            <Link href="/scanner" className="hover:text-white transition-colors">Document Scanner</Link>
            <Link href="/verification" className="hover:text-white transition-colors">Verification</Link>
            <Link href="/reports" className="hover:text-white transition-colors">Reports</Link>
            <Link href="/activity" className="hover:text-white transition-colors">Activity</Link>
            <Link href="/api-access" className="hover:text-white transition-colors">API</Link>
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
            <Link href="#documentation" className="hover:text-white transition-colors">Documentation</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSignInModal(true)}
              className="px-4 py-2 rounded-lg bg-surface-100 hover:bg-surface-50 border border-border text-xs font-semibold text-slate-200 transition-colors"
            >
              Sign In
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm shadow-blue-900/30 transition-all flex items-center gap-1.5"
            >
              <span>Operational Console</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.15),rgba(255,255,255,0))] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-400 text-xs font-medium mb-6">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
            <span>Authorized Enterprise Identity Screening Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            Secure Document Intelligence for <span className="text-blue-500">Authorized Verification</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Scan, analyze and securely process identity documents with AI-powered OCR and document intelligence.
            Engineered for hotels, financial institutions, enterprises, verification desks, and investigation teams.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/scanner"
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-900/40 transition-all flex items-center gap-2"
            >
              <Scan className="h-4 w-4" />
              <span>Launch Document Scanner</span>
            </Link>

            <button
              onClick={() => setShowSignInModal(true)}
              className="px-6 py-3 rounded-lg bg-surface-100 hover:bg-surface-50 border border-border text-slate-200 font-semibold text-sm transition-colors flex items-center gap-2"
            >
              <Lock className="h-4 w-4 text-slate-400" />
              <span>Access Institutional Portal</span>
            </button>
          </div>

          {/* Supported Government Documents Badge Row */}
          <div className="mt-14 pt-8 border-t border-border/60 max-w-3xl mx-auto">
            <p className="text-xs uppercase font-semibold tracking-wider text-slate-500 mb-4">
              Supported Statutory Identity Standards
            </p>
            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs text-slate-300 font-mono">
              <span className="px-3 py-1.5 rounded-md bg-surface-100 border border-border">Aadhaar (UIDAI)</span>
              <span className="px-3 py-1.5 rounded-md bg-surface-100 border border-border">PAN Card (ITD)</span>
              <span className="px-3 py-1.5 rounded-md bg-surface-100 border border-border">Passport (ICAO 9303)</span>
              <span className="px-3 py-1.5 rounded-md bg-surface-100 border border-border">Driving Licence</span>
              <span className="px-3 py-1.5 rounded-md bg-surface-100 border border-border">Voter ID (EPIC)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Pipeline Flow */}
      <section id="platform" className="py-20 border-b border-border/50 bg-[#0a0f1c]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Enterprise Document Screening Architecture
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              An end-to-end operational pipeline combining optical character recognition, structural verification, forensic inspection, and explainable risk assessment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-surface-100 border border-border hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400 mb-4">
                <Scan className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">1. Capture & Image Enhancement</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Browser camera stream with real-time alignment framing guides, glare detection, blur estimation (Laplacian variance), and contrast normalization before OCR ingestion.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface-100 border border-border hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-indigo-950/80 border border-indigo-800/80 flex items-center justify-center text-indigo-400 mb-4">
                <FileCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">2. OCR & Structured Parsing</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Multi-provider abstraction supporting Tesseract and Cloud Vision. Automatic classification with mathematical checksum validation (Verhoeff and ICAO 9303 MRZ).
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface-100 border border-border hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mb-4">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">3. Forensics & TRISHUL Handoff</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Visual anomaly mapping, biometric face similarity comparison, explainable 0-100 risk scoring, and cryptographic transmission to the TRISHUL intelligence ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance & Privacy Guarantees */}
      <section id="security" className="py-16 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="p-8 rounded-2xl bg-gradient-to-b from-surface-100 to-surface-200 border border-border grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-950 text-blue-400 text-xs font-semibold border border-blue-800 mb-3">
                <Lock className="h-3.5 w-3.5" />
                <span>Enterprise Data Governance</span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Designed for Strict Regulatory & PII Compliance
              </h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Personal identifiable information (PII) is automatically masked across all user interfaces (e.g., Aadhaar <span className="font-mono text-slate-300">XXXX XXXX 1234</span>).
                Controlled unmasking requires verified role authorization and is immutably logged to the institutional audit trail.
              </p>

              <div className="mt-6 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Configurable data retention policies (instant purge or institutional archiving)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Role-based access control (Operator, Investigator, Reviewer, Administrator)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>No storage of unmasked government identifiers without cryptographic audit seals</span>
                </div>
              </div>
            </div>

            <div className="bg-[#080c14] p-5 rounded-xl border border-border font-mono text-xs text-slate-300 space-y-2 shadow-inner">
              <div className="flex items-center justify-between pb-2 border-b border-border text-slate-500">
                <span>SECURITY AUDIT STREAM</span>
                <span className="text-emerald-400">ACTIVE LOGGING</span>
              </div>
              <p className="text-slate-400">
                <span className="text-blue-400">[2026-09-15T09:18:22Z]</span> SCREENING_PROCESSED: UID Verhoeff checksum verified.
              </p>
              <p className="text-slate-400">
                <span className="text-blue-400">[2026-09-15T09:18:24Z]</span> PII_MASK: Aadhaar displayed as XXXX XXXX 3841.
              </p>
              <p className="text-slate-400">
                <span className="text-blue-400">[2026-09-15T09:18:30Z]</span> TRISHUL_HANDOFF: Cryptographic hash 7f9a2d... queued.
              </p>
              <p className="text-emerald-400">
                <span className="text-blue-400">[2026-09-15T09:18:32Z]</span> RETENTION_DAEMON: Ephemeral buffer cleared.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Footer */}
      <footer className="py-10 bg-[#06090f] text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-slate-300">TRISHUL Document Intelligence</span>
            <span>&mdash; Enterprise Verification Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/security" className="hover:text-slate-300">Security & Privacy</Link>
            <Link href="/api-access" className="hover:text-slate-300">API Documentation</Link>
            <Link href="/dashboard" className="hover:text-slate-300">Console</Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4 text-center sm:text-left text-[11px] text-slate-600">
          This system is restricted to authorized operational personnel for lawful identity screening and compliance purposes.
        </div>
      </footer>

      {/* Sign In / Role Selection Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-surface-100 border border-border rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold text-white text-base">Operator Authentication</h3>
              </div>
              <button
                onClick={() => setShowSignInModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Institutional Operator ID / Email
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="operator@organization.org"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  defaultValue="Trishul@Enterprise2026"
                  className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Active Operational Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["OPERATOR", "INVESTIGATOR", "REVIEWER", "ADMINISTRATOR"] as const).map((role) => (
                    <button
                      type="button"
                      key={role}
                      onClick={() => {
                        setSelectedRole(role);
                        setEmailInput(`${role.toLowerCase()}@trishul-intel.org`);
                      }}
                      className={`px-3 py-2 rounded-lg border text-xs font-mono font-medium transition-all text-left ${
                        selectedRole === role
                          ? "bg-blue-600/20 border-blue-500 text-blue-400 font-bold"
                          : "bg-surface-200 border-border text-slate-400 hover:bg-surface-50 hover:text-slate-200"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? "Authenticating..." : "Authorize & Enter Console"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
