import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit/logger";

export const dynamic = "force-dynamic";

export async function GET(
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
        id: params.id,
        organizationId: user.organizationId,
      },
      include: {
        documents: {
          select: {
            id: true,
            applicationId: true,
            category: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            sha256Hash: true,
            issueDate: true,
            expiryDate: true,
            issuer: true,
            referenceNumber: true,
            ocrStatus: true,
            ocrText: true,
            ocrConfidence: true,
            duplicateOfId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        findings: {
          orderBy: { createdAt: "desc" },
        },
        sourceChecks: {
          orderBy: { verifiedAt: "desc" },
        },
        infrastructureReviews: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application case not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: application });
  } catch (error) {
    console.error("[GET_INSTITUTION_APPLICATION_BY_ID]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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
        id: params.id,
        organizationId: user.organizationId,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application case not found" }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.reviewerNotes !== undefined) updateData.reviewerNotes = body.reviewerNotes;
    if (body.terFeeStatus !== undefined) updateData.terFeeStatus = body.terFeeStatus;
    if (body.terFeeReference !== undefined) updateData.terFeeReference = body.terFeeReference;
    if (body.approvedIntake !== undefined) updateData.approvedIntake = Number(body.approvedIntake);
    if (body.requestedIntake !== undefined) updateData.requestedIntake = Number(body.requestedIntake);
    if (body.facultyCount !== undefined) updateData.facultyCount = Number(body.facultyCount);
    if (body.requiredFacultyCount !== undefined) updateData.requiredFacultyCount = Number(body.requiredFacultyCount);
    if (body.infrastructureSubmitted !== undefined) updateData.infrastructureSubmitted = Boolean(body.infrastructureSubmitted);
    if (body.previousApprovalRef !== undefined) updateData.previousApprovalRef = body.previousApprovalRef;
    if (body.validationStatus !== undefined) updateData.validationStatus = body.validationStatus;

    const updated = await prisma.institutionApplication.update({
      where: { id: params.id },
      data: updateData,
    });

    await recordAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      userEmail: user.email,
      action: "INSTITUTION_APPLICATION_UPDATED",
      resourceType: "INSTITUTION_APPLICATION",
      resourceId: application.applicationNumber,
      details: `Updated parameters for application case ${application.applicationNumber}.`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH_INSTITUTION_APPLICATION]", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
