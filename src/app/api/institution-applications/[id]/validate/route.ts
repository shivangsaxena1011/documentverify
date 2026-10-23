import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit/logger";
import { evaluateRegulatoryRules } from "@/lib/aicte/ruleset";
import { ApplicationCategory, DocumentCategory } from "@/lib/aicte/types";

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
      include: {
        documents: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application case not found" }, { status: 404 });
    }

    // Run AICTE Rules Engine
    const summary = evaluateRegulatoryRules({
      applicationNumber: application.applicationNumber,
      institutionName: application.institutionName,
      permanentId: application.permanentId,
      applicationCategory: application.applicationCategory as ApplicationCategory,
      academicYear: application.academicYear,
      previousApprovalRef: application.previousApprovalRef,
      previousApprovalStatus: application.previousApprovalStatus,
      institutionRecordStatus: application.institutionRecordStatus,
      terFeeStatus: application.terFeeStatus,
      terFeeReference: application.terFeeReference,
      approvedIntake: application.approvedIntake,
      requestedIntake: application.requestedIntake,
      facultyCount: application.facultyCount,
      requiredFacultyCount: application.requiredFacultyCount,
      infrastructureSubmitted: application.infrastructureSubmitted,
      documents: application.documents.map((d) => ({
        id: d.id,
        category: d.category as DocumentCategory,
        fileName: d.fileName,
        sha256Hash: d.sha256Hash,
        issueDate: d.issueDate,
        expiryDate: d.expiryDate,
        issuer: d.issuer,
        referenceNumber: d.referenceNumber,
        ocrStatus: d.ocrStatus,
        ocrText: d.ocrText,
        duplicateOfId: d.duplicateOfId,
      })),
    });

    // Determine updated validation status based on findings
    let newValidationStatus = application.validationStatus;
    if (application.validationStatus === "DRAFT" || application.validationStatus === "VALIDATION_PENDING") {
      if (summary.failedCount > 0) {
        newValidationStatus = "RECTIFICATION_REQUESTED";
      } else if (summary.warningCount > 0 || summary.manualReviewCount > 0) {
        newValidationStatus = "OFFICIAL_REVIEW_REQUIRED";
      } else {
        newValidationStatus = "READY_FOR_OFFICIAL_SCRUTINY";
      }
    }

    // Persist findings in transaction
    await prisma.$transaction([
      prisma.validationFinding.deleteMany({
        where: { applicationId: application.id },
      }),
      prisma.validationFinding.createMany({
        data: summary.findings.map((f) => ({
          applicationId: application.id,
          ruleId: f.ruleId,
          ruleSource: f.ruleSource,
          rulesetVersion: f.rulesetVersion,
          severity: f.severity,
          status: f.status,
          title: f.title,
          reason: f.reason,
          documentReference: f.documentReference || null,
          recommendedNextStep: f.recommendedNextStep,
        })),
      }),
      prisma.institutionApplication.update({
        where: { id: application.id },
        data: {
          complianceScore: summary.complianceScore,
          rulesetVersion: summary.rulesetVersion,
          lastValidatedAt: new Date(),
          validationStatus: newValidationStatus,
        },
      }),
    ]);

    await recordAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      userEmail: user.email,
      action: "REGULATORY_VALIDATION_EXECUTED",
      resourceType: "INSTITUTION_APPLICATION",
      resourceId: application.applicationNumber,
      details: `Executed AICTE ruleset ${summary.rulesetVersion}: Score ${summary.complianceScore}%, ${summary.passedCount} Passed, ${summary.failedCount} Failed, ${summary.warningCount} Warnings.`,
    });

    return NextResponse.json({
      success: true,
      data: summary,
      validationStatus: newValidationStatus,
    });
  } catch (error) {
    console.error("[POST_APPLICATION_VALIDATE]", error);
    return NextResponse.json({ error: "Failed to execute regulatory validation" }, { status: 500 });
  }
}
