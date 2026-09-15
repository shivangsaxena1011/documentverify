import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await prisma.screeningSession.findFirst({
      where: {
        OR: [{ id }, { screeningId: id }],
      },
      include: {
        operator: { select: { name: true, email: true, role: true } },
        organization: { select: { name: true, code: true } },
        document: true,
        ocrResult: true,
        extractedFields: true,
        documentAnalysis: true,
        forensicAnomalies: true,
        faceVerification: true,
        riskAssessment: true,
        trishulHandoff: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Screening record not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: session });
  } catch (error: any) {
    console.error("[SCREENING_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to load screening record." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const currentUser = await getCurrentUser();

    const session = await prisma.screeningSession.findFirst({
      where: { OR: [{ id }, { screeningId: id }] },
      include: { document: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Screening record not found." }, { status: 404 });
    }

    // Role check: Only REVIEWER or ADMINISTRATOR can delete or purge
    if (currentUser && !["REVIEWER", "ADMINISTRATOR"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Insufficient authorization to purge screening records. Administrator or Reviewer role required." },
        { status: 403 }
      );
    }

    // Purge document image according to retention policy
    if (session.document) {
      await prisma.document.update({
        where: { id: session.document.id },
        data: {
          base64Data: null,
          isPurged: true,
          purgedAt: new Date(),
        },
      });
    }

    await recordAuditLog({
      organizationId: session.organizationId,
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      action: "DOCUMENT_IMAGE_PURGED",
      resourceType: "SCREENING_SESSION",
      resourceId: session.screeningId,
      details: "Document image payload irreversibly purged from system storage per data retention protocol.",
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      message: "Document image purged successfully according to organizational data privacy policy.",
    });
  } catch (error: any) {
    console.error("[SCREENING_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to purge document." }, { status: 500 });
  }
}
