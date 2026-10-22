import crypto from "crypto";
import { prisma } from "../db";
import { OCRFactory } from "../ocr/factory";
import { DocumentCategory } from "./types";

export interface DocumentUploadInput {
  applicationId: string;
  organizationId: string;
  category: DocumentCategory;
  fileName: string;
  mimeType: string;
  fileSize: number;
  base64Data: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  issuer?: string | null;
  referenceNumber?: string | null;
}

export interface DocumentUploadResult {
  id: string;
  applicationId: string;
  category: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sha256Hash: string;
  ocrStatus: string;
  ocrTextPreview: string | null;
  duplicateOfId: string | null;
  isDuplicate: boolean;
  issueDate: Date | null;
  expiryDate: Date | null;
  issuer: string | null;
  referenceNumber: string | null;
  createdAt: Date;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

export class ApplicationDocumentStorage {
  /**
   * Validate, store, hash, and extract OCR metadata from an institution document.
   */
  public static async processAndStoreDocument(
    input: DocumentUploadInput
  ): Promise<DocumentUploadResult> {
    // 1. Server-side validation
    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new Error(
        `Unsupported document format: ${input.mimeType}. Only PDF, PNG, and JPG/JPEG files are accepted under AICTE regulatory intake guidelines.`
      );
    }

    if (input.fileSize > MAX_FILE_SIZE) {
      throw new Error(
        `File size (${(input.fileSize / (1024 * 1024)).toFixed(2)}MB) exceeds maximum permitted limit of 15MB.`
      );
    }

    // 2. Decode buffer safely to compute SHA-256 hash
    const cleanBase64 = input.base64Data.replace(/^data:.*?;base64,/, "");
    const fileBuffer = Buffer.from(cleanBase64, "base64");

    const sha256Hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // 3. Duplicate Detection via SHA-256 hash within the organization
    const existingDuplicate = await prisma.applicationDocument.findFirst({
      where: {
        sha256Hash,
        application: {
          organizationId: input.organizationId,
        },
      },
      select: {
        id: true,
        fileName: true,
        applicationId: true,
      },
    });

    const duplicateOfId = existingDuplicate ? existingDuplicate.id : null;

    // 4. OCR Extraction for supported image formats
    let ocrStatus = "PENDING";
    let ocrText: string | null = null;
    let ocrConfidence: number | null = null;

    if (input.mimeType === "application/pdf") {
      // PDF documents require specialized PDF parser or manual reviewer inspection
      ocrStatus = "UNAVAILABLE_MANUAL_REVIEW";
      ocrText = "[PDF Document: Native optical character recognition unavailable in serverless environment. Manual reviewer verification required.]";
      ocrConfidence = 0.0;
    } else if (input.mimeType.startsWith("image/")) {
      try {
        const ocrProvider = OCRFactory.getProvider();
        const ocrResult = await ocrProvider.processImage(input.base64Data);
        ocrStatus = ocrResult.fullText && ocrResult.fullText.trim().length > 0 ? "EXTRACTED" : "UNAVAILABLE_MANUAL_REVIEW";
        ocrText = ocrResult.fullText;
        ocrConfidence = ocrResult.averageConfidence;
      } catch (err) {
        console.warn("[AICTE_DOC_OCR_FALLBACK]", err);
        ocrStatus = "UNAVAILABLE_MANUAL_REVIEW";
        ocrText = "[OCR unavailable: Manual reviewer verification required]";
      }
    }

    // 5. Persist document record (with abstracted storage)
    const doc = await prisma.applicationDocument.create({
      data: {
        applicationId: input.applicationId,
        category: input.category,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        sha256Hash,
        base64Data: input.base64Data, // Store safely in database
        storageKey: `org_${input.organizationId}/app_${input.applicationId}/${sha256Hash.slice(0, 16)}_${input.fileName}`,
        issueDate: input.issueDate ? new Date(input.issueDate) : null,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        issuer: input.issuer || null,
        referenceNumber: input.referenceNumber || null,
        ocrStatus,
        ocrText,
        ocrConfidence,
        duplicateOfId,
      },
    });

    return {
      id: doc.id,
      applicationId: doc.applicationId,
      category: doc.category,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      sha256Hash: doc.sha256Hash,
      ocrStatus: doc.ocrStatus,
      ocrTextPreview: doc.ocrText ? doc.ocrText.slice(0, 250) : null,
      duplicateOfId,
      isDuplicate: Boolean(duplicateOfId),
      issueDate: doc.issueDate,
      expiryDate: doc.expiryDate,
      issuer: doc.issuer,
      referenceNumber: doc.referenceNumber,
      createdAt: doc.createdAt,
    };
  }
}
