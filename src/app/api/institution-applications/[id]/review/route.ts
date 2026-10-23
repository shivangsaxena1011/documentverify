import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit/logger";

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

    if (user.role !== "REVIEWER" && user.role !== "ADMINISTRATOR" && user.role !== "INVESTIGATOR") {
      return NextResponse.json(
        { error: "Forbidden: Authorized Reviewer, Investigator, or Administrator credentials required." },
        { status: 403 }
      );
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
    const actionType = body.actionType || body.action;
    const observationNotes = body.observationNotes || body.notes;

    let nextStatus = application.validationStatus;
    let auditAction = "REVIEWER_OBSERVATION_RECORDED";

    const timestampStr = new Date().toISOString().replace("T", " ").slice(0, 19);
    const newNoteEntry = `[${timestampStr}] ${user.name} (${user.role}): ${observationNotes || actionType}`;
    const updatedNotes = application.reviewerNotes
      ? `${application.reviewerNotes}\n\n${newNoteEntry}`
      : newNoteEntry;

    switch (actionType) {
      case "REQUEST_RECTIFICATION":
        nextStatus = "RECTIFICATION_REQUESTED";
        auditAction = "APPLICATION_RECTIFICATION_REQUESTED";
        break;
      case "ESCALATE_FOR_SCRUTINY":
        nextStatus = "READY_FOR_OFFICIAL_SCRUTINY";
        auditAction = "APPLICATION_ESCALATED_FOR_SCRUTINY";
        break;
      case "MARK_UNDER_REVIEW":
        nextStatus = "UNDER_REVIEW";
        auditAction = "APPLICATION_MARKED_UNDER_REVIEW";
        break;
      case "CLOSE_CASE":
        if (user.role !== "ADMINISTRATOR") {
          return NextResponse.json(
            { error: "Forbidden: Administrative authority required to close an institutional application case." },
            { status: 403 }
          );
        }
        nextStatus = "CLOSED";
        auditAction = "APPLICATION_ADMINISTRATIVELY_CLOSED";
        break;
      case "RECORD_OBSERVATION":
        // Status remains unchanged
        break;
      default:
        return NextResponse.json({ error: `Unrecognized review action: ${actionType}` }, { status: 400 });
    }

    const updated = await prisma.institutionApplication.update({
      where: { id: application.id },
      data: {
        validationStatus: nextStatus,
        reviewerNotes: updatedNotes,
      },
    });

    await recordAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      userEmail: user.email,
      action: auditAction,
      resourceType: "INSTITUTION_APPLICATION",
      resourceId: application.applicationNumber,
      details: `Action [${actionType}] executed by ${user.name}. Status updated from ${application.validationStatus} to ${nextStatus}. Notes: ${observationNotes || "N/A"}`,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      statusTransition: {
        from: application.validationStatus,
        to: nextStatus,
      },
    });
  } catch (error) {
    console.error("[POST_APPLICATION_REVIEW]", error);
    return NextResponse.json({ error: "Failed to record review action" }, { status: 500 });
  }
}
