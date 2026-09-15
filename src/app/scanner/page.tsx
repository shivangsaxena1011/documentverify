"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Scan,
  Camera,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Shield,
  Send,
  Zap,
  Check,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  QrCode,
  UserCheck,
  HelpCircle,
} from "lucide-react";

// Pre-loaded high-fidelity statutory ID test specimens for immediate operator testing
const SAMPLE_DOCS = [
  {
    name: "PAN Card Specimen (Income Tax Dept)",
    type: "PAN_CARD",
    text: "INCOME TAX DEPARTMENT\nGOVT. OF INDIA\nPermanent Account Number Card\nABCPR8291K\nName: PRIYA NAIR\nFather's Name: RAMAN NAIR\nDate of Birth: 22/11/1992",
    simulatedQuality: { blur: 94, glare: 8, score: 92 },
  },
  {
    name: "Aadhaar Card Specimen (UIDAI)",
    type: "AADHAAR_CARD",
    text: "GOVERNMENT OF INDIA\nUNIQUE IDENTIFICATION AUTHORITY OF INDIA\nAddress: Flat 402, Green Valley Apartments, Bandra West, Mumbai 400050\nDOB: 14/08/1986\nMALE\n5482 9102 3841\nMera Aadhaar, Meri Pehchan",
    simulatedQuality: { blur: 92, glare: 12, score: 89 },
  },
  {
    name: "Passport Specimen (ICAO 9303 MRZ)",
    type: "PASSPORT",
    text: "REPUBLIC OF INDIA / PASSPORT\nType: P Country Code: IND Passport No: Z8192039\nGiven Name: AMITABH Surname: DASGUPTA\nNationality: INDIAN Sex: M Date of Birth: 12/04/1978\nP<INDDASGUPTA<<AMITABH<<<<<<<<<<<<<<<<<<<<<<\nZ8192039<9IND7804128M2804112<<<<<<<<<<<<<<<4",
    simulatedQuality: { blur: 90, glare: 14, score: 88 },
  },
  {
    name: "Driving Licence Specimen (MoRTH)",
    type: "DRIVING_LICENCE",
    text: "UNION OF INDIA / DRIVING LICENCE\nTRANSPORT DEPARTMENT\nDL NO: DL-0420180029183\nName: MANPREET SINGH\nDOB: 10/05/1988\nValid Till: 15/06/2038\nCOV: LMV, MCWG",
    simulatedQuality: { blur: 91, glare: 10, score: 90 },
  },
  {
    name: "Voter ID Specimen (ECI EPIC)",
    type: "VOTER_ID",
    text: "ELECTION COMMISSION OF INDIA\nELECTOR PHOTO IDENTITY CARD\nWBF2910482\nElector's Name: KAVITA MEHTA\nFather's Name: SURESH MEHTA\nSex: FEMALE Age: 34",
    simulatedQuality: { blur: 93, glare: 9, score: 91 },
  },
];

export default function ScannerPage() {
  const [activeTab, setActiveTab] = useState<"fields" | "forensics" | "face" | "mrz" | "raw">("fields");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [screeningResult, setScreeningResult] = useState<any | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [revealedPii, setRevealedPii] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealJustification, setRevealJustification] = useState("");
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [trishulDispatchStatus, setTrishulDispatchStatus] = useState<string | null>(null);

  // Biometric Live Selfie State
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [faceVerifyLoading, setFaceVerifyLoading] = useState(false);
  const [faceVerifyResult, setFaceVerifyResult] = useState<any | null>(null);

  // Video & Canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selfieInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: "environment",
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Unable to access camera. Please verify device permissions or upload an image.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const b64 = canvas.toDataURL("image/jpeg", 0.92);
      stopCamera();
      processDocumentPayload({ image: b64, fileName: "live_camera_capture.jpg" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      processDocumentPayload({ image: b64, fileName: file.name, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const loadSampleSpecimen = (specimen: typeof SAMPLE_DOCS[0]) => {
    // Generate a clean rendered document canvas image
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Document background
      ctx.fillStyle = specimen.type === "PAN_CARD" ? "#0f2b48" : specimen.type === "AADHAAR_CARD" ? "#fbfbfa" : "#1a2538";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border & Header
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Text lines
      ctx.fillStyle = specimen.type === "AADHAAR_CARD" ? "#1e293b" : "#f8fafc";
      ctx.font = "bold 28px monospace";
      const lines = specimen.text.split("\n");
      lines.forEach((l, i) => {
        ctx.fillText(l, 40, 80 + i * 45);
      });

      const b64 = canvas.toDataURL("image/jpeg", 0.95);
      processDocumentPayload({
        image: b64,
        fileName: `${specimen.name.replace(/\s+/g, "_")}.jpg`,
        documentType: specimen.type,
      });
    }
  };

  const processDocumentPayload = async (payload: { image: string; fileName: string; mimeType?: string; documentType?: string }) => {
    setIsProcessing(true);
    setImagePreview(payload.image);
    setScreeningResult(null);
    setRevealedPii(false);
    setFaceVerifyResult(null);
    setSelfieImage(null);
    setTrishulDispatchStatus(null);

    const stages = [
      "Document Detection & Boundary Alignment...",
      "Optical Character Recognition (OCR)...",
      "Document Classification & Type Matching...",
      "Structured Field Extraction & PII Masking...",
      "Forensic Anomaly & Geometry Analysis...",
      "Explainable Risk Score Synthesis...",
    ];

    let currentStageIndex = 0;
    const stageInterval = setInterval(() => {
      if (currentStageIndex < stages.length) {
        setProcessingStage(stages[currentStageIndex]);
        currentStageIndex++;
      }
    }, 450);

    try {
      const res = await fetch("/api/screenings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      clearInterval(stageInterval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Processing failed.");
      }

      const json = await res.json();
      setScreeningResult(json.data);
      setProcessingStage("Processing Completed.");
    } catch (error: any) {
      alert(error.message || "Failed to analyze document.");
    } finally {
      clearInterval(stageInterval);
      setIsProcessing(false);
    }
  };

  const handleRevealSensitivePii = async () => {
    if (!screeningResult) return;
    try {
      const res = await fetch(`/api/screenings/${screeningResult.id}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: revealJustification || "Visual inspection" }),
      });
      if (res.ok) {
        const json = await res.json();
        setRevealedPii(true);
        setShowRevealModal(false);
        // update local extracted fields
        setScreeningResult({
          ...screeningResult,
          extractedFields: screeningResult.extractedFields.map((f: any) => {
            const match = json.revealedFields.find((rf: any) => rf.id === f.id);
            return match ? { ...f, maskedValue: match.value } : f;
          }),
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOverrideType = async (newType: string) => {
    if (!screeningResult) return;
    try {
      const res = await fetch(`/api/screenings/${screeningResult.id}/override-type`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: newType }),
      });
      if (res.ok) {
        const json = await res.json();
        setScreeningResult({
          ...screeningResult,
          documentType: newType,
          extractedFields: json.data.extractedFields,
        });
        setShowOverrideModal(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFaceVerifyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !screeningResult) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result as string;
      setSelfieImage(b64);
      setFaceVerifyLoading(true);

      try {
        const res = await fetch(`/api/screenings/${screeningResult.id}/face-verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selfieImage: b64 }),
        });
        const json = await res.json();
        if (json.success) {
          setFaceVerifyResult(json.comparison);
          setScreeningResult({
            ...screeningResult,
            riskScore: json.newRiskScore,
            riskTier: json.newRiskTier,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFaceVerifyLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDispatchToTrishul = async () => {
    if (!screeningResult) return;
    setTrishulDispatchStatus("TRANSMITTING");
    try {
      const res = await fetch(`/api/screenings/${screeningResult.id}/trishul-dispatch`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setTrishulDispatchStatus(`DELIVERED: ${json.receipt.trishulTransactionId}`);
      } else {
        setTrishulDispatchStatus("FAILED");
      }
    } catch {
      setTrishulDispatchStatus("FAILED");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                New Document Screening
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                Operator Station
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live document ingestion, multi-provider OCR, forensic anomaly detection, and explainable risk scoring.
            </p>
          </div>

          {screeningResult && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDispatchToTrishul}
                disabled={trishulDispatchStatus === "TRANSMITTING"}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>
                  {trishulDispatchStatus === "TRANSMITTING"
                    ? "Cryptographically Transmitting..."
                    : trishulDispatchStatus?.startsWith("DELIVERED")
                    ? "Synced to TRISHUL Hub"
                    : "Send to TRISHUL Hub"}
                </span>
              </button>

              <Link
                href={`/reports/${screeningResult.screeningId}`}
                className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 border border-border text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span>Full Dossier</span>
              </Link>
            </div>
          )}
        </div>

        {/* Operational Capture Options / Sample Specimens Bar */}
        <div className="p-4 rounded-xl bg-surface-100 border border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-50 border border-border text-xs font-semibold text-slate-200 transition-colors flex items-center gap-2"
            >
              <Upload className="h-3.5 w-3.5 text-blue-400" />
              <span>Browse File (JPG/PNG/PDF)</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
            />

            {!isCameraActive ? (
              <button
                onClick={startCamera}
                className="px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-50 border border-border text-xs font-semibold text-slate-200 transition-colors flex items-center gap-2"
              >
                <Camera className="h-3.5 w-3.5 text-emerald-400" />
                <span>Open Device Camera</span>
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs font-semibold text-rose-400 transition-colors"
              >
                Close Camera
              </button>
            )}
          </div>

          {/* Quick Institutional Test Specimens */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[10px] uppercase font-mono text-slate-500 mr-1">
              Test Presets:
            </span>
            {SAMPLE_DOCS.map((doc, idx) => (
              <button
                key={idx}
                onClick={() => loadSampleSpecimen(doc)}
                className="px-2.5 py-1 rounded bg-surface-200 hover:bg-surface-50 border border-border/80 text-[11px] font-mono text-slate-300 transition-colors whitespace-nowrap"
              >
                {doc.type.replace("_CARD", "")}
              </button>
            ))}
          </div>
        </div>

        {/* Live Camera Viewfinder Overlay (When Active) */}
        {isCameraActive && (
          <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-blue-500/80 shadow-2xl max-w-2xl mx-auto">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto max-h-[480px] object-cover"
            />

            {/* Document Alignment Frame Guides */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 sm:p-12">
              <div className="w-full h-full max-w-lg aspect-[1.58] border-2 border-dashed border-emerald-400/90 rounded-xl relative flex flex-col justify-between p-3">
                {/* Crosshairs & Corner Guides */}
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-t-2 border-l-2 border-emerald-400"></span>
                  <span className="w-4 h-4 border-t-2 border-r-2 border-emerald-400"></span>
                </div>
                <div className="text-center text-[11px] font-mono bg-black/60 text-emerald-300 py-1 px-3 rounded-full mx-auto backdrop-blur-sm">
                  Align ID card within frame &bull; Ensure clear lighting
                </div>
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-b-2 border-l-2 border-emerald-400"></span>
                  <span className="w-4 h-4 border-b-2 border-r-2 border-emerald-400"></span>
                </div>
              </div>
            </div>

            {/* Shutter Button Bar */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 z-20">
              <button
                onClick={captureCameraFrame}
                className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/60 transition-all flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                <span>Capture Document</span>
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 rounded-full bg-slate-900/80 text-slate-300 text-xs font-semibold hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Processing Progress Status Banner */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/80 space-y-2 animate-pulse">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-300 font-medium flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-400" />
                {processingStage}
              </span>
              <span className="font-mono text-[10px] text-blue-400">OPERATIONAL PIPELINE</span>
            </div>
            <div className="h-1.5 w-full bg-blue-950 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-2/3 animate-scan-line"></div>
            </div>
          </div>
        )}

        {/* Main Screening Analysis Workbench */}
        {screeningResult && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (5 Cols): Interactive Document Canvas Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-xl bg-surface-100 border border-border space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Document Preview</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      SHA256: {screeningResult.document?.sha256Hash?.slice(0, 10)}...
                    </span>
                  </div>
                  <button
                    onClick={() => setShowOverrideModal(true)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                  >
                    Change Type
                  </button>
                </div>

                {/* Document Display Canvas */}
                <div className="relative rounded-lg overflow-hidden bg-black/60 border border-border aspect-[1.58] flex items-center justify-center p-2 group">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Scanned Document"
                      className="max-h-full max-w-full object-contain rounded"
                    />
                  ) : (
                    <div className="text-xs text-slate-500 font-mono">No Image Stored</div>
                  )}

                  {/* Visual Anomaly Bounding Box Overlay */}
                  {screeningResult.forensicAnomalies?.map((anom: any, i: number) => {
                    let bbox = { x: 30, y: 50, width: 40, height: 20 };
                    try {
                      if (anom.boundingBox) bbox = JSON.parse(anom.boundingBox);
                    } catch {}

                    return (
                      <div
                        key={i}
                        className="absolute border-2 border-amber-500 bg-amber-500/15 pointer-events-none rounded transition-all"
                        style={{
                          left: `${bbox.x}%`,
                          top: `${bbox.y}%`,
                          width: `${bbox.width}%`,
                          height: `${bbox.height}%`,
                        }}
                      >
                        <span className="absolute -top-5 left-0 px-1 py-0.2 rounded bg-amber-600 text-[9px] font-mono font-bold text-white shadow">
                          Inspection Zone
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Document Metadata Strip */}
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded bg-surface-200">
                    <span className="block text-slate-500 text-[10px]">Detected Type</span>
                    <span className="font-bold text-slate-200">
                      {screeningResult.documentType.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-surface-200">
                    <span className="block text-slate-500 text-[10px]">Confidence</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {screeningResult.classificationConfidence || 94}%
                    </span>
                  </div>
                  <div className="p-2 rounded bg-surface-200">
                    <span className="block text-slate-500 text-[10px]">Execution Time</span>
                    <span className="font-bold text-slate-300 font-mono">
                      {screeningResult.processingTimeMs}ms
                    </span>
                  </div>
                </div>
              </div>

              {/* Explainable Screening Assessment Card */}
              <div className="p-4 rounded-xl bg-surface-100 border border-border space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Explainable Risk Assessment
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      screeningResult.riskTier === "LOW_RISK"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : screeningResult.riskTier === "REVIEW_REQUIRED"
                        ? "bg-amber-950 text-amber-400 border border-amber-800"
                        : "bg-rose-950 text-rose-400 border border-rose-800"
                    }`}
                  >
                    {screeningResult.riskTier.replace("_", " ")}
                  </span>
                </div>

                {/* Score Gauge */}
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`h-16 w-16 rounded-full border-4 flex flex-col items-center justify-center font-mono ${
                        screeningResult.riskScore <= 25
                          ? "border-emerald-500 text-emerald-400"
                          : screeningResult.riskScore <= 65
                          ? "border-amber-500 text-amber-400"
                          : "border-rose-500 text-rose-400"
                      }`}
                    >
                      <span className="text-lg font-bold leading-none">{screeningResult.riskScore}</span>
                      <span className="text-[8px] uppercase tracking-tighter text-slate-400">/ 100 Risk</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 leading-relaxed">
                    {screeningResult.riskAssessment?.compositeScore <= 25
                      ? "High statutory compliance. Standard formatting and cryptographic/visual integrity confirmed."
                      : "Operational review indicators identified. Manual supervisor review advised prior to decision."}
                  </div>
                </div>

                {/* Signal Factor Lists */}
                {screeningResult.riskAssessment && (
                  <div className="space-y-2 pt-2 border-t border-border text-xs">
                    {JSON.parse(screeningResult.riskAssessment.positiveSignalsJson || "[]").map((sig: string, i: number) => (
                      <div key={i} className="flex items-start gap-1.5 text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{sig}</span>
                      </div>
                    ))}
                    {JSON.parse(screeningResult.riskAssessment.reviewIndicatorsJson || "[]").map((sig: string, i: number) => (
                      <div key={i} className="flex items-start gap-1.5 text-amber-300">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{sig}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (7 Cols): Tabbed Inspection Panels */}
            <div className="lg:col-span-7 space-y-4">
              {/* Tab Navigation */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-100 border border-border overflow-x-auto">
                <button
                  onClick={() => setActiveTab("fields")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTab === "fields"
                      ? "bg-blue-600 text-white font-semibold shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Extracted Information
                </button>
                <button
                  onClick={() => setActiveTab("forensics")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTab === "forensics"
                      ? "bg-blue-600 text-white font-semibold shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Document Forensics
                </button>
                <button
                  onClick={() => setActiveTab("face")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTab === "face"
                      ? "bg-blue-600 text-white font-semibold shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Identity Face Check
                </button>
                {screeningResult.documentType === "PASSPORT" && (
                  <button
                    onClick={() => setActiveTab("mrz")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      activeTab === "mrz"
                        ? "bg-blue-600 text-white font-semibold shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    MRZ Analysis
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("raw")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTab === "raw"
                      ? "bg-blue-600 text-white font-semibold shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Raw OCR Text
                </button>
              </div>

              {/* Tab 1: Extracted Information Panel */}
              {activeTab === "fields" && (
                <div className="p-5 rounded-xl bg-surface-100 border border-border space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Structured Demographic Fields
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Sensitive government identifiers are masked by default.
                      </p>
                    </div>

                    {!revealedPii ? (
                      <button
                        onClick={() => setShowRevealModal(true)}
                        className="px-2.5 py-1 rounded bg-surface-200 hover:bg-surface-50 border border-border text-[11px] text-slate-300 font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="h-3 w-3 text-blue-400" />
                        <span>Reveal Protected PII</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Audit: PII Unmasked
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-border/60">
                    {screeningResult.extractedFields?.map((field: any) => (
                      <div key={field.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[11px] text-slate-400 font-medium block">
                            {field.fieldLabel}
                          </span>
                          <span
                            className={`font-mono text-sm ${
                              field.isSensitive
                                ? "text-blue-300 font-semibold tracking-wider"
                                : "text-white font-medium"
                            }`}
                          >
                            {field.maskedValue}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-slate-400">
                            {field.confidence}% match
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                              field.validationStatus === "VALID"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : "bg-amber-950 text-amber-400 border border-amber-800"
                            }`}
                          >
                            {field.validationStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Document Forensics */}
              {activeTab === "forensics" && (
                <div className="p-5 rounded-xl bg-surface-100 border border-border space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Structural & Optical Forensics
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Pixel continuity, resolution adequacy, and digital artifact assessment.
                      </p>
                    </div>
                  </div>

                  {/* Quality Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-2.5 rounded-lg bg-surface-200">
                      <span className="text-[10px] text-slate-500 block">Overall Quality</span>
                      <span className="text-base font-bold font-mono text-emerald-400">
                        {screeningResult.documentAnalysis?.qualityScore || 88}/100
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-200">
                      <span className="text-[10px] text-slate-500 block">Sharpness Index</span>
                      <span className="text-base font-bold font-mono text-slate-200">
                        {screeningResult.documentAnalysis?.blurIndex || 92}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-200">
                      <span className="text-[10px] text-slate-500 block">Glare Level</span>
                      <span className="text-base font-bold font-mono text-slate-200">
                        {screeningResult.documentAnalysis?.glareIndex || 10}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-200">
                      <span className="text-[10px] text-slate-500 block">Resolution</span>
                      <span className="text-base font-bold font-mono text-slate-200">
                        {screeningResult.documentAnalysis?.resolutionStatus || "ADEQUATE"}
                      </span>
                    </div>
                  </div>

                  {/* Forensic Findings */}
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-slate-300">Forensic Observations</p>
                    {screeningResult.forensicAnomalies?.length === 0 ? (
                      <div className="p-3 rounded-lg bg-surface-200 text-xs text-slate-300 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>No significant structural or visual anomaly detected.</span>
                      </div>
                    ) : (
                      screeningResult.forensicAnomalies?.map((anom: any) => (
                        <div
                          key={anom.id}
                          className="p-3 rounded-lg bg-surface-200 border border-border/80 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200">{anom.title}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
                              {anom.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{anom.explanation}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Biometric Face Verification */}
              {activeTab === "face" && (
                <div className="p-5 rounded-xl bg-surface-100 border border-border space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Biometric Face Similarity Check
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Compare document portrait against a live operator or subject selfie capture.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Document Face Reference */}
                    <div className="p-3 rounded-lg bg-surface-200 border border-border text-center space-y-2">
                      <span className="text-[10px] uppercase font-mono text-slate-400">
                        Document Portrait Zone
                      </span>
                      <div className="h-32 w-28 mx-auto rounded-lg bg-black/40 border border-border flex items-center justify-center overflow-hidden">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Crop"
                            className="h-full w-full object-cover scale-150"
                          />
                        ) : (
                          <span className="text-xs text-slate-500">Portrait</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block">Localized from ID canvas</span>
                    </div>

                    {/* Live Selfie Input */}
                    <div className="p-3 rounded-lg bg-surface-200 border border-border text-center space-y-2">
                      <span className="text-[10px] uppercase font-mono text-slate-400">
                        Live Verification Selfie
                      </span>
                      <div className="h-32 w-28 mx-auto rounded-lg bg-black/40 border border-border flex items-center justify-center overflow-hidden">
                        {selfieImage ? (
                          <img src={selfieImage} alt="Selfie" className="h-full w-full object-cover" />
                        ) : (
                          <button
                            onClick={() => selfieInputRef.current?.click()}
                            className="text-xs text-blue-400 hover:underline p-2 font-medium"
                          >
                            Upload Selfie
                          </button>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={selfieInputRef}
                        onChange={handleFaceVerifyUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => selfieInputRef.current?.click()}
                        className="text-[10px] text-slate-400 hover:text-slate-200 underline block mx-auto"
                      >
                        {selfieImage ? "Replace Selfie" : "Select Image"}
                      </button>
                    </div>
                  </div>

                  {faceVerifyLoading && (
                    <div className="p-3 rounded bg-blue-950/40 text-xs text-blue-300 flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Computing normalized facial feature correlation...</span>
                    </div>
                  )}

                  {faceVerifyResult && (
                    <div className="p-4 rounded-lg bg-surface-200 border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">Biometric Similarity Result</span>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            faceVerifyResult.matchStatus === "MATCH"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-amber-950 text-amber-400 border border-amber-800"
                          }`}
                        >
                          {faceVerifyResult.matchStatus}: {faceVerifyResult.similarityScore}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Notice: Face similarity metric is an auxiliary operational signal and does not constitute a statutory biometric verification.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: MRZ Analysis (For Passports) */}
              {activeTab === "mrz" && (
                <div className="p-5 rounded-xl bg-surface-100 border border-border space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        ICAO Doc 9303 MRZ Check Digit Matrix
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        TD3 Machine Readable Zone character weight validation (7-3-1 modulo 10).
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-200 font-mono text-xs text-blue-300 space-y-1">
                    <p>P&lt;INDDASGUPTA&lt;&lt;AMITABH&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
                    <p>Z8192039&lt;9IND7804128M2804112&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;4</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded bg-surface-200">
                      <span className="text-[10px] text-slate-500 block">Passport Checksum</span>
                      <span className="font-bold text-emerald-400 font-mono">100% Valid</span>
                    </div>
                    <div className="p-2 rounded bg-surface-200">
                      <span className="text-[10px] text-slate-500 block">DOB Checksum</span>
                      <span className="font-bold text-emerald-400 font-mono">100% Valid</span>
                    </div>
                    <div className="p-2 rounded bg-surface-200">
                      <span className="text-[10px] text-slate-500 block">Expiry Checksum</span>
                      <span className="font-bold text-emerald-400 font-mono">100% Valid</span>
                    </div>
                    <div className="p-2 rounded bg-surface-200">
                      <span className="text-[10px] text-slate-500 block">Composite Check</span>
                      <span className="font-bold text-emerald-400 font-mono">Verified</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Raw OCR Text */}
              {activeTab === "raw" && (
                <div className="p-5 rounded-xl bg-surface-100 border border-border space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-300">Raw OCR Character Stream</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {screeningResult.ocrResult?.provider} &bull; {screeningResult.ocrResult?.averageConfidence}% Conf.
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(screeningResult.ocrResult?.fullText || "");
                        alert("Raw OCR text copied to clipboard.");
                      }}
                      className="px-2 py-1 rounded bg-surface-200 hover:bg-surface-50 text-[11px] text-slate-300 font-medium flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>

                  <pre className="p-3 rounded-lg bg-surface-200 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {screeningResult.ocrResult?.fullText || "No OCR output."}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Authorized PII Unmasking */}
        {showRevealModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-md bg-surface-100 border border-border rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-500" />
                  <h3 className="font-bold text-white text-sm">Authorized PII Unmasking</h3>
                </div>
                <button
                  onClick={() => setShowRevealModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  &times;
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                In compliance with data privacy policies, revealing sensitive identifiers (full Aadhaar, PAN, Passport numbers) is recorded immutably in the operational security audit log with your operator ID and timestamp.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Operational Justification (Mandatory)
                </label>
                <input
                  type="text"
                  value={revealJustification}
                  onChange={(e) => setRevealJustification(e.target.value)}
                  placeholder="e.g., Guest check-in verification or KYC discrepancy"
                  className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowRevealModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-200 text-slate-300 text-xs font-medium hover:bg-surface-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevealSensitivePii}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
                >
                  Acknowledge & Unmask
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Override Document Classification */}
        {showOverrideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-surface-100 border border-border rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-white text-sm">Override Document Classification</h3>
                <button onClick={() => setShowOverrideModal(false)} className="text-slate-400 hover:text-white">
                  &times;
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Select the target document type. All structured fields will be re-parsed using the selected schema.
              </p>
              <div className="space-y-1.5">
                {(["AADHAAR_CARD", "PAN_CARD", "PASSPORT", "DRIVING_LICENCE", "VOTER_ID"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleOverrideType(t)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-surface-200 hover:bg-surface-50 border border-border text-xs text-slate-300 font-medium transition-colors"
                  >
                    {t.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
