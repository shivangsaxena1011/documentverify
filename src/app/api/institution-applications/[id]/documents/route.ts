import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit/logger";
import { ApplicationDocumentStorage } from "@/lib/aicte/document-storage";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const application = await prisma.institutionApplication.findFirst({
      where: {
        OR: [{ id: params.id }, { applicationNumber: params.id }],
        organizationId: user.organizationId,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application case not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      category,
      fileName,
      mimeType,
      fileSize,
      base64Data,
      issueDate,
      expiryDate,
      issuer,
      referenceNumber,
    } = body;

    if (!category || !fileName || !mimeType || !base64Data) {
      return NextResponse.json(
        { error: "category, fileName, mimeType, and base64Data are required" },
        { status: 400 }
      );
    }

    const documentResult = await ApplicationDocumentStorage.processAndStoreDocument({
      applicationId: application.id,
      organizationId: user.organizationId,
      category,
      fileName,
      mimeType,
      fileSize: Number(fileSize) || 0,
      base64Data,
      issueDate,
      expiryDate,
      issuer,
      referenceNumber,
    });

    // If this is infrastructure evidence, link an infrastructure review record
    if (category === "INFRASTRUCTURE_EVIDENCE") {
      await prisma.infrastructureReview.create({
        data: {
          applicationId: application.id,
          documentId: documentResult.id,
          evidenceType: "CLASSROOM_LAB_PHOTO",
          observations: `Infrastructure file [${fileName}] submitted for instructional and laboratory facilities scrutiny.`,
          reviewStatus: "PENDING_REVIEW",
        },
      });

      await prisma.institutionApplication.update({
        where: { id: application.id },
        data: { infrastructureSubmitted: true },
      });
    }

    await recordAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      userEmail: user.email,
      action: "APPLICATION_DOCUMENT_UPLOADED",
      resourceType: "APPLICATION_DOCUMENT",
      resourceId: documentResult.id,
      details: `Uploaded [${category}] document ${fileName} (Hash: ${documentResult.sha256Hash.slice(0, 12)}...) for ${application.applicationNumber}.`,
    });

    return NextResponse.json({ success: true, data: documentResult }, { status: 201 });
  } catch (error) {
    console.error("[POST_APPLICATION_DOCUMENT]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload document" },
      { status: 500 }
    );
  }
}
