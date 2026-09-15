import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { DocumentType } from "@/lib/classifier/document-classifier";
import { extractFieldsForDocument } from "@/lib/extractors";
import { recordAuditLog } from "@/lib/audit/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const newDocType = body.documentType as DocumentType;

    if (!newDocType) {
      return NextResponse.json({ error: "Target document type is required." }, { status: 400 });
    }

    const session = await prisma.screeningSession.findFirst({
      where: { OR: [{ id }, { screeningId: id }] },
      include: { ocrResult: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Screening record not found." }, { status: 404 });
    }

    const ocrText = session.ocrResult?.fullText || "";
    const reExtraction = extractFieldsForDocument(newDocType, ocrText);

    // Replace extracted fields in DB
    await prisma.extractedField.deleteMany({
      where: { screeningSessionId: session.id },
    });

    await prisma.extractedField.createMany({
      data: reExtraction.fields.map((f) => ({
        screeningSessionId: session.id,
        fieldKey: f.key,
        fieldLabel: f.label,
        rawValue: f.rawValue,
        maskedValue: f.maskedValue,
        isSensitive: f.isSensitive,
        confidence: f.confidence,
        validationStatus: f.validationStatus,
      })),
    });

    // Update document type
    const updated = await prisma.screeningSession.update({
      where: { id: session.id },
      data: {
        documentType: newDocType,
      },
      include: { extractedFields: true },
    });

    const currentUser = await getCurrentUser();
    await recordAuditLog({
      organizationId: session.organizationId,
      userId: currentUser?.id,
      action: "DOCUMENT_TYPE_OVERRIDDEN",
      resourceType: "SCREENING_SESSION",
      resourceId: session.screeningId,
      details: `Operator changed classification from ${session.documentType} to ${newDocType}.`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      message: `Document classification updated to ${newDocType}. Fields re-extracted.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("[OVERRIDE_TYPE_ERROR]", error);
    return NextResponse.json({ error: "Failed to override document type." }, { status: 500 });
  }
}
