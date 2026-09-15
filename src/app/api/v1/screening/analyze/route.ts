import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { OCRFactory } from "@/lib/ocr/factory";
import { DocumentClassifier } from "@/lib/classifier/document-classifier";
import { extractFieldsForDocument } from "@/lib/extractors";
import { assessImageQuality } from "@/lib/forensics/image-quality";
import { analyzeForensics } from "@/lib/forensics/forensic-detector";
import { ScreeningAssessmentEngine } from "@/lib/risk/screening-assessment-engine";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized. Institutional Bearer API Key required in Authorization header." },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const apiKey = await prisma.apiKey.findFirst({
      where: { hashedSecret: hashed, isActive: true },
      include: { organization: true },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: "Invalid or revoked API Key." },
        { status: 403 }
      );
    }

    // Update lastUsedAt
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    const body = await req.json();
    if (!body.image) {
      return NextResponse.json({ error: "Field 'image' (Base64 string) is required." }, { status: 400 });
    }

    const base64Data: string = body.image;
    const base64Clean = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const buffer = Buffer.from(base64Clean, "base64");
    const sha256Hash = crypto.createHash("sha256").update(buffer).digest("hex");

    const ocrProvider = OCRFactory.getProvider();
    const ocrResult = await ocrProvider.processImage(base64Data);

    const classification = DocumentClassifier.classify(ocrResult.fullText);
    const extraction = extractFieldsForDocument(classification.documentType, ocrResult.fullText);
    const quality = assessImageQuality(1920, 1080, ocrResult.averageConfidence, ocrResult.fullText.length);
    const forensics = analyzeForensics(
      classification.documentType,
      extraction.fields,
      ocrResult.averageConfidence,
      ocrResult.fullText
    );

    const risk = ScreeningAssessmentEngine.evaluate({
      documentType: classification.documentType,
      classificationConfidence: classification.confidence,
      ocrConfidence: ocrResult.averageConfidence,
      quality,
      fields: extraction.fields,
      forensics,
    });

    return NextResponse.json({
      status: "SUCCESS",
      screeningId: `TR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      documentType: classification.documentType,
      classificationConfidence: classification.confidence,
      riskAssessment: {
        score: risk.compositeScore,
        tier: risk.riskTier,
        positiveSignals: risk.positiveSignals,
        reviewIndicators: risk.reviewIndicators,
        summary: risk.explainabilitySummary,
      },
      extractedFields: extraction.fields.map((f) => ({
        key: f.key,
        label: f.label,
        maskedValue: f.maskedValue,
        confidence: f.confidence,
        status: f.validationStatus,
      })),
      forensicAnalysis: {
        anomaliesCount: forensics.anomalies.length,
        qualityScore: quality.qualityScore,
        structuralIntegrity: quality.structuralIntegrity,
      },
      cryptographicHash: sha256Hash,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[API_V1_SCREENING_ERROR]", error);
    return NextResponse.json({ error: "Internal Document Intelligence processing error." }, { status: 500 });
  }
}
