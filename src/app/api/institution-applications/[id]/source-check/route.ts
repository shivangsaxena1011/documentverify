import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit/logger";
import { ExternalAuthorityVerificationAdapter } from "@/lib/aicte/source-adapter";

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
        id: params.id,
        organizationId: user.organizationId,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application case not found" }, { status: 404 });
    }

    const body = await req.json();
    const { target, manualDecision } = body;

    // Check for manual verification action by reviewer
    if (manualDecision) {
      if (user.role !== "REVIEWER" && user.role !== "ADMINISTRATOR" && user.role !== "INVESTIGATOR") {
        return NextResponse.json(
          { error: "Forbidden: Only authorized Reviewers, Investigators, or Administrators may record manual authority verifications." },
          { status: 403 }
        );
      }

      const manualRecord = await prisma.sourceVerificationRecord.create({
        data: {
          applicationId: application.id,
          documentId: manualDecision.documentId || null,
          sourceProvider: manualDecision.sourceProvider || "Authorized Reviewer Scrutiny",
          verificationTarget: manualDecision.target || "INSTITUTION_RECORD",
          status: manualDecision.status || "VERIFIED",
          summary: manualDecision.notes || "Manual document authenticity verified against official records.",
          detailsJson: JSON.stringify({
            verifiedByEmail: user.email,
            verifiedByName: user.name,
            timestamp: new Date().toISOString(),
            notes: manualDecision.notes,
          }),
          verifiedBy: user.email,
        },
      });

      await recordAuditLog({
        organizationId: user.organizationId,
        userId: user.id,
        userEmail: user.email,
        action: "MANUAL_SOURCE_VERIFICATION_RECORDED",
        resourceType: "SOURCE_VERIFICATION_RECORD",
        resourceId: manualRecord.id,
        details: `Reviewer ${user.name} recorded manual source verification [${manualDecision.status}] for ${application.applicationNumber}: ${manualDecision.notes}`,
      });

      return NextResponse.json({ success: true, data: manualRecord });
    }

    // Automated source checks using adapter
    const results = [];

    // 1. Institution record check
    const instResult = await ExternalAuthorityVerificationAdapter.verifyInstitutionRecord(
      application.permanentId,
      application.institutionName
    );

    const instRecord = await prisma.sourceVerificationRecord.create({
      data: {
        applicationId: application.id,
        sourceProvider: instResult.sourceProvider,
        verificationTarget: instResult.verificationTarget,
        status: instResult.status,
        summary: instResult.summary,
        detailsJson: JSON.stringify(instResult.details),
        verifiedBy: "SYSTEM_GATEWAY",
      },
    });
    results.push(instRecord);

    // 2. TER payment check if applicable
    if (application.terFeeReference || application.terFeeStatus) {
      const terResult = await ExternalAuthorityVerificationAdapter.verifyTerPayment(
        application.terFeeReference || application.applicationNumber,
        application.permanentId
      );

      const terRecord = await prisma.sourceVerificationRecord.create({
        data: {
          applicationId: application.id,
          sourceProvider: terResult.sourceProvider,
          verificationTarget: terResult.verificationTarget,
          status: terResult.status,
          summary: terResult.summary,
          detailsJson: JSON.stringify(terResult.details),
          verifiedBy: "SYSTEM_GATEWAY",
        },
      });
      results.push(terRecord);
    }

    await recordAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      userEmail: user.email,
      action: "EXTERNAL_SOURCE_CHECK_DISPATCHED",
      resourceType: "INSTITUTION_APPLICATION",
      resourceId: application.applicationNumber,
      details: `Executed external source check adapters across ${results.length} targets for ${application.applicationNumber}.`,
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("[POST_APPLICATION_SOURCE_CHECK]", error);
    return NextResponse.json({ error: "Failed to dispatch source verification" }, { status: 500 });
  }
}
