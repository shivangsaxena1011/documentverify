import { DocumentType } from "../classifier/document-classifier";
import { ParsedField } from "../extractors/aadhaar";
import { QualityAssessment } from "../forensics/image-quality";
import { ForensicResult } from "../forensics/forensic-detector";
import { FaceComparisonResult } from "../biometrics/face-comparison";

export interface RiskAssessmentResult {
  compositeScore: number; // 0 (safest) to 100 (highest risk)
  riskTier: "LOW_RISK" | "REVIEW_REQUIRED" | "HIGH_RISK";
  positiveSignals: string[];
  reviewIndicators: string[];
  explainabilitySummary: string;
}

export class ScreeningAssessmentEngine {
  static evaluate(params: {
    documentType: DocumentType;
    classificationConfidence: number;
    ocrConfidence: number;
    quality: QualityAssessment;
    fields: ParsedField[];
    forensics: ForensicResult;
    face?: FaceComparisonResult | null;
  }): RiskAssessmentResult {
    let riskPoints = 10; // baseline operational baseline
    const positiveSignals: string[] = [];
    const reviewIndicators: string[] = [];

    // 1. Classification & Type Confidence
    if (params.documentType !== "UNKNOWN" && params.classificationConfidence >= 75) {
      positiveSignals.push(
        `Document classification verified as ${params.documentType.replace(/_/g, " ")} (${params.classificationConfidence}% confidence)`
      );
    } else {
      riskPoints += 25;
      reviewIndicators.push("Ambiguous document type classification; manual document type verification required.");
    }

    // 2. Optical Character Recognition Quality
    if (params.ocrConfidence >= 80) {
      positiveSignals.push(`High optical character recognition fidelity (${params.ocrConfidence}% OCR confidence)`);
    } else if (params.ocrConfidence < 65) {
      riskPoints += 20;
      reviewIndicators.push(`Sub-optimal OCR confidence (${params.ocrConfidence}%); optical illegibility in text regions`);
    }

    // 3. Image Physical Quality
    if (params.quality.qualityScore >= 70) {
      positiveSignals.push(`Image sharpness and illumination meet enterprise standards (Score: ${params.quality.qualityScore}/100)`);
    } else {
      riskPoints += 15;
      reviewIndicators.push(`Image quality suboptimal (Blur: ${params.quality.blurIndex}, Glare: ${params.quality.glareIndex})`);
    }

    // 4. Mandatory Field Presence & Checksum Validation
    const hasSensitivePrimary = params.fields.some((f) => f.isSensitive && f.validationStatus === "VALID");
    const warningFields = params.fields.filter((f) => f.validationStatus === "WARNING");

    if (hasSensitivePrimary) {
      positiveSignals.push("Primary statutory identification number extracted with valid syntax and checksum");
    } else {
      riskPoints += 20;
      reviewIndicators.push("Primary identification number missing or failed statutory format check");
    }

    if (warningFields.length > 0) {
      riskPoints += 10 * warningFields.length;
      reviewIndicators.push(`${warningFields.length} field(s) require manual review due to formatting variance`);
    }

    // 5. Forensic Anomalies
    if (!params.forensics.overallAnomalyDetected) {
      positiveSignals.push("Visual forensics analysis: No significant structural or digital anomalies detected");
    } else {
      const highSeverity = params.forensics.anomalies.filter((a) => a.severity === "HIGH");
      const modSeverity = params.forensics.anomalies.filter((a) => a.severity === "MODERATE");

      riskPoints += highSeverity.length * 25 + modSeverity.length * 12;
      reviewIndicators.push(
        `Forensic inspection identified ${params.forensics.anomalies.length} anomaly signal(s) requiring verification review`
      );
    }

    // 6. Optional Biometric Face Comparison
    if (params.face) {
      if (params.face.matchStatus === "MATCH") {
        positiveSignals.push(`Biometric facial similarity confirmed (${params.face.similarityScore}% match score)`);
        riskPoints = Math.max(0, riskPoints - 10);
      } else if (params.face.matchStatus === "REVIEW_REQUIRED") {
        riskPoints += 15;
        reviewIndicators.push(`Biometric face similarity in review zone (${params.face.similarityScore}%)`);
      } else if (params.face.matchStatus === "NO_MATCH") {
        riskPoints += 30;
        reviewIndicators.push(`Biometric face comparison failed: portrait mismatch (${params.face.similarityScore}%)`);
      }
    }

    // Clamp score
    const compositeScore = Math.min(100, Math.max(0, riskPoints));

    let riskTier: "LOW_RISK" | "REVIEW_REQUIRED" | "HIGH_RISK" = "LOW_RISK";
    if (compositeScore >= 66) {
      riskTier = "HIGH_RISK";
    } else if (compositeScore >= 26) {
      riskTier = "REVIEW_REQUIRED";
    }

    const explainabilitySummary =
      riskTier === "LOW_RISK"
        ? "Document screening indicates high compliance with statutory formatting and visual integrity benchmarks. No actionable risk flags identified."
        : riskTier === "REVIEW_REQUIRED"
        ? "Screening indicators identify specific fields or visual elements requiring human reviewer evaluation before operational acceptance."
        : "Elevated risk index triggered due to critical formatting discrepancies or forensic anomalies. Rigorous manual inspection or secondary identification mandatory.";

    return {
      compositeScore,
      riskTier,
      positiveSignals,
      reviewIndicators,
      explainabilitySummary,
    };
  }
}
