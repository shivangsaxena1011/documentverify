"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  CheckSquare,
  ShieldAlert,
  Server,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
} from "lucide-react";

export default function VerificationGatewayPage() {
  const [activeGateway, setActiveGateway] = useState("sandbox");

  const gateways = [
    {
      name: "UIDAI Aadhaar Verification Service (AUA/KUA)",
      status: "SANDBOX_ACTIVE",
      type: "Institutional Certificate Required",
      authStandard: "e-KYC 2.5 API with HSM Signing",
      desc: "Requires institutional Sub-AUA agreement with UIDAI. Operates in local cryptographic simulation mode when unbonded.",
    },
    {
      name: "Income Tax Department / NSDL PAN Verification",
      status: "SANDBOX_ACTIVE",
      type: "Authorized Financial Intermediary",
      authStandard: "Direct REST / Digital Signature (DSC)",
      desc: "Verifies PAN authenticity and name-match threshold against the National NSDL/UTI database.",
    },
    {
      name: "Passport Seva Institutional Verification API",
      status: "INACTIVE",
      type: "Law Enforcement / Immigration Clearance",
      authStandard: "mPassport Police App Gateway (Secured VPN)",
      desc: "Requires direct institutional lease line to the Ministry of External Affairs central verification repository.",
    },
    {
      name: "MoRTH Sarathi Driving Licence Verification",
      status: "SANDBOX_ACTIVE",
      type: "Transport Department Gateway",
      authStandard: "National Informatics Centre (NIC) Gateway",
      desc: "Verifies driving licence number, validity periods, and authorized vehicle classes against the National Register.",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Statutory Verification Gateway Architecture
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct institutional connectors to government identity databases and regulatory verification networks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded bg-amber-950 text-amber-400 border border-amber-800 font-semibold">
              Gateway State: Institutional Sandbox
            </span>
          </div>
        </div>

        {/* Enterprise Transparency Notice */}
        <div className="p-4 rounded-xl bg-surface-100 border border-border flex items-start gap-3 text-xs">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-200">
              Institutional Gateway Compliance Statement
            </p>
            <p className="text-slate-400 leading-relaxed">
              In accordance with statutory guidelines, direct queries to official government databases (Aadhaar, PAN, Passport, DL) are restricted to authorized legal entities with verified AUA/KUA licenses or statutory authority. TRISHUL Document Intelligence provides an open gateway adapter architecture that securely binds with your organization’s licensed credentials. In the absence of an authorized live certificate, the gateway operates truthfully in sandbox/isolated verification mode.
            </p>
          </div>
        </div>

        {/* Gateway Connectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gateways.map((gw, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-surface-100 border border-border space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-bold text-white">{gw.name}</h3>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                      gw.status === "SANDBOX_ACTIVE"
                        ? "bg-amber-950 text-amber-400 border border-amber-800"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {gw.status.replace("_", " ")}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {gw.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-border/60 space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Interface Standard:</span>
                  <span className="text-slate-300">{gw.authStandard}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Credential Protocol:</span>
                  <span className="text-blue-400">{gw.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
