import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { PRELIMINARY_DECISION_DISCLAIMER } from "@/lib/aicte/ruleset";
import crypto from "crypto";

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
            ocrConfidence: true,
            duplicateOfId: true,
            createdAt: true,
          },
        },
        findings: true,
        sourceChecks: true,
        infrastructureReviews: true,
        organization: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application case not found" }, { status: 404 });
    }

    // Fetch related audit logs for this application
    const auditEvents = await prisma.auditLog.findMany({
      where: {
        organizationId: user.organizationId,
        resourceId: application.applicationNumber,
      },
      orderBy: { timestamp: "desc" },
      take: 25,
    });

    // Compute cryptographic dossier verification seal
    const dossierSignaturePayload = JSON.stringify({
      appNumber: application.applicationNumber,
      permanentId: application.permanentId,
      rulesetVersion: application.rulesetVersion,
      complianceScore: application.complianceScore,
      documentsCount: application.documents.length,
      hashes: application.documents.map((d) => d.sha256Hash).sort(),
    });

    const cryptographicSeal = crypto
      .createHash("sha256")
      .update(dossierSignaturePayload)
      .digest("hex");

    const dossier = {
      title: "AICTE Regulatory Compliance & Application Validation Dossier",
      subtitle: "Autonomous Decision Support System — SIH 2026 Problem Statement 26261",
      dossierId: `DOSSIER-${application.applicationNumber}`,
      generatedAt: new Date().toISOString(),
      cryptographicSeal,
      application: {
        id: application.id,
        applicationNumber: application.applicationNumber,
        institutionName: application.institutionName,
        permanentId: application.permanentId,
        applicationCategory: application.applicationCategory,
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
        validationStatus: application.validationStatus,
        complianceScore: application.complianceScore,
        rulesetVersion: application.rulesetVersion,
        lastValidatedAt: application.lastValidatedAt,
        reviewerNotes: application.reviewerNotes,
        organization: application.organization,
      },
      documentManifest: application.documents.map((d) => ({
        id: d.id,
        category: d.category,
        fileName: d.fileName,
        fileSizeFormatted: `${(d.fileSize / 1024).toFixed(1)} KB`,
        sha256Hash: d.sha256Hash,
        ocrStatus: d.ocrStatus,
        isDuplicate: Boolean(d.duplicateOfId),
        issuer: d.issuer || "Not recorded",
        issueDate: d.issueDate ? d.issueDate.toISOString().split("T")[0] : "N/A",
        expiryDate: d.expiryDate ? d.expiryDate.toISOString().split("T")[0] : "N/A",
        uploadedAt: d.createdAt.toISOString(),
      })),
      regulatoryFindings: application.findings.map((f) => ({
        ruleId: f.ruleId,
        severity: f.severity,
        status: f.status,
        title: f.title,
        reason: f.reason,
        ruleSource: f.ruleSource,
        recommendedNextStep: f.recommendedNextStep,
        documentReference: f.documentReference,
      })),
      sourceVerifications: application.sourceChecks.map((sc) => ({
        provider: sc.sourceProvider,
        target: sc.verificationTarget,
        status: sc.status,
        summary: sc.summary,
        verifiedBy: sc.verifiedBy,
        verifiedAt: sc.verifiedAt.toISOString(),
      })),
      infrastructureEvaluations: application.infrastructureReviews.map((ir) => ({
        type: ir.evidenceType,
        status: ir.reviewStatus,
        observations: ir.observations,
        gaps: ir.evidenceGaps || "None recorded",
      })),
      auditTrail: auditEvents.map((a) => ({
        timestamp: a.timestamp.toISOString(),
        actor: a.userEmail || "System",
        action: a.action,
        details: a.details,
      })),
      legalDisclaimer: PRELIMINARY_DECISION_DISCLAIMER,
    };

    return NextResponse.json({ success: true, data: dossier });
  } catch (error) {
    console.error("[GET_APPLICATION_REPORT]", error);
    return NextResponse.json({ error: "Failed to generate validation report" }, { status: 500 });
  }
}
