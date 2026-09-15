import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { OCRFactory } from "@/lib/ocr/factory";
import { DocumentClassifier, DocumentType } from "@/lib/classifier/document-classifier";
import { extractFieldsForDocument } from "@/lib/extractors";
import { assessImageQuality } from "@/lib/forensics/image-quality";
import { analyzeForensics } from "@/lib/forensics/forensic-detector";
import { ScreeningAssessmentEngine } from "@/lib/risk/screening-assessment-engine";
import { recordAuditLog } from "@/lib/audit/logger";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const documentType = searchParams.get("documentType") || "";
    const riskTier = searchParams.get("riskTier") || "";
    const status = searchParams.get("status") || "";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const where: any = {};

    if (documentType && documentType !== "ALL") {
      where.documentType = documentType;
    }
    if (riskTier && riskTier !== "ALL") {
      where.riskTier = riskTier;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { screeningId: { contains: search } },
        { documentType: { contains: search } },
        {
          extractedFields: {
            some: {
              rawValue: { contains: search },
            },
          },
        },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.screeningSession.count({ where }),
      prisma.screeningSession.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: "desc" },
        include: {
          operator: { select: { name: true, email: true } },
          extractedFields: true,
          documentAnalysis: true,
          riskAssessment: true,
          trishulHandoff: true,
          forensicAnomalies: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: items,
    });
  } catch (error: any) {
    console.error("[SCREENINGS_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to retrieve screening records." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const sessionUser = await getCurrentUser();
    let operatorId = sessionUser?.id;
    let organizationId = sessionUser?.organizationId;

    if (!operatorId || !organizationId) {
      const defaultUser = await prisma.user.findFirst();
      if (defaultUser) {
        operatorId = defaultUser.id;
        organizationId = defaultUser.organizationId;
      } else {
        return NextResponse.json({ error: "Operator session unauthorized." }, { status: 401 });
      }
    }

    let fileBuffer: Buffer | null = null;
    let fileName = "scan_capture.jpg";
    let mimeType = "image/jpeg";
    let base64Data: string | null = null;
    let forcedDocType: DocumentType | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("document") as File;
      const docTypeParam = formData.get("documentType") as string;
      if (docTypeParam) forcedDocType = docTypeParam as DocumentType;

      if (!file) {
        return NextResponse.json({ error: "No document file provided in request." }, { status: 400 });
      }

      fileName = file.name || "upload.jpg";
      mimeType = file.type || "image/jpeg";
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      base64Data = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
    } else {
      const body = await req.json();
      if (!body.image) {
        return NextResponse.json({ error: "Missing document image payload." }, { status: 400 });
      }
      base64Data = body.image;
      fileName = body.fileName || "camera_scan.jpg";
      mimeType = body.mimeType || "image/jpeg";
      if (body.documentType) forcedDocType = body.documentType as DocumentType;

      const base64Clean = base64Data!.includes(",") ? base64Data!.split(",")[1] : base64Data!;
      fileBuffer = Buffer.from(base64Clean, "base64");
    }

    // SHA-256 integrity hash
    const sha256Hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    const screeningId = `TR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // Execute OCR Provider
    const ocrProvider = OCRFactory.getProvider();
    const ocrResult = await ocrProvider.processImage(base64Data || fileBuffer);

    // Classify Document
    const classification = DocumentClassifier.classify(ocrResult.fullText);
    const finalDocType: DocumentType = forcedDocType && forcedDocType !== "UNKNOWN"
      ? forcedDocType
      : classification.documentType;

    // Structured Field Extraction
    const extraction = extractFieldsForDocument(finalDocType, ocrResult.fullText);

    // Image Quality Assessment
    const quality = assessImageQuality(
      1920,
      1080,
      ocrResult.averageConfidence,
      ocrResult.fullText.length
    );

    // Forensic Anomaly Inspection
    const forensics = analyzeForensics(
      finalDocType,
      extraction.fields,
      ocrResult.averageConfidence,
      ocrResult.fullText
    );

    // Screening Risk Assessment
    const risk = ScreeningAssessmentEngine.evaluate({
      documentType: finalDocType,
      classificationConfidence: classification.confidence,
      ocrConfidence: ocrResult.averageConfidence,
      quality,
      fields: extraction.fields,
      forensics,
    });

    const processingTimeMs = Date.now() - startTime;
    const finalStatus =
      risk.riskTier === "HIGH_RISK"
        ? "FLAGGED"
        : risk.riskTier === "REVIEW_REQUIRED"
        ? "REQUIRES_REVIEW"
        : "COMPLETED";

    // Save to database
    const session = await prisma.screeningSession.create({
      data: {
        screeningId,
        documentType: finalDocType,
        detectedType: classification.documentType,
        classificationConfidence: classification.confidence,
        status: finalStatus,
        riskScore: risk.compositeScore,
        riskTier: risk.riskTier,
        processingTimeMs,
        operatorId,
        organizationId,
        document: {
          create: {
            fileName,
            mimeType,
            fileSize: fileBuffer.length,
            sha256Hash,
            base64Data: base64Data?.slice(0, 1000000), // Keep for visual workbench
          },
        },
        ocrResult: {
          create: {
            provider: ocrResult.provider,
            fullText: ocrResult.fullText,
            averageConfidence: ocrResult.averageConfidence,
            wordsCount: ocrResult.wordsCount,
            linesCount: ocrResult.linesCount,
            executionTimeMs: ocrResult.executionTimeMs,
            wordsJson: ocrResult.words ? JSON.stringify(ocrResult.words.slice(0, 80)) : null,
          },
        },
        documentAnalysis: {
          create: {
            qualityScore: quality.qualityScore,
            blurIndex: quality.blurIndex,
            glareIndex: quality.glareIndex,
            brightnessScore: quality.brightnessScore,
            contrastScore: quality.contrastScore,
            resolutionStatus: quality.resolutionStatus,
            structuralIntegrity: quality.structuralIntegrity,
            fontConsistencyScore: forensics.fontConsistencyScore,
            layoutAlignmentScore: forensics.layoutAlignmentScore,
          },
        },
        riskAssessment: {
          create: {
            compositeScore: risk.compositeScore,
            riskTier: risk.riskTier,
            positiveSignalsJson: JSON.stringify(risk.positiveSignals),
            reviewIndicatorsJson: JSON.stringify(risk.reviewIndicators),
          },
        },
        extractedFields: {
          create: extraction.fields.map((f) => ({
            fieldKey: f.key,
            fieldLabel: f.label,
            rawValue: f.rawValue,
            maskedValue: f.maskedValue,
            isSensitive: f.isSensitive,
            confidence: f.confidence,
            validationStatus: f.validationStatus,
          })),
        },
        forensicAnomalies: {
          create: forensics.anomalies.map((a) => ({
            anomalyType: a.anomalyType,
            severity: a.severity,
            title: a.title,
            explanation: a.explanation,
            confidence: a.confidence,
            boundingBox: a.boundingBox ? JSON.stringify(a.boundingBox) : null,
          })),
        },
      },
      include: {
        document: true,
        ocrResult: true,
        extractedFields: true,
        documentAnalysis: true,
        forensicAnomalies: true,
        riskAssessment: true,
      },
    });

    await recordAuditLog({
      organizationId,
      userId: operatorId,
      action: "SCREENING_PROCESSED",
      resourceType: "SCREENING_SESSION",
      resourceId: session.screeningId,
      details: `Screened ${finalDocType} with Risk Score ${risk.compositeScore} (${risk.riskTier}) in ${processingTimeMs}ms.`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      screeningId: session.screeningId,
      id: session.id,
      documentType: finalDocType,
      detectedType: classification.documentType,
      classificationConfidence: classification.confidence,
      status: finalStatus,
      riskScore: risk.compositeScore,
      riskTier: risk.riskTier,
      processingTimeMs,
      data: session,
    });
  } catch (error: any) {
    console.error("[SCREENING_PIPELINE_ERROR]", error);
    return NextResponse.json(
      { error: "We couldn't reliably process this document. Please upload a clearer image or try again." },
      { status: 500 }
    );
  }
}
