import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit/logger";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const where: any = {
      organizationId: user.organizationId,
    };

    if (category && category !== "ALL") {
      where.applicationCategory = category;
    }
    if (status && status !== "ALL") {
      where.validationStatus = status;
    }
    if (search) {
      where.OR = [
        { applicationNumber: { contains: search } },
        { institutionName: { contains: search } },
        { permanentId: { contains: search } },
      ];
    }

    const [total, items, pendingValidationCount, flaggedCount, readyCount] = await Promise.all([
      prisma.institutionApplication.count({ where }),
      prisma.institutionApplication.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { updatedAt: "desc" },
        include: {
          documents: {
            select: {
              id: true,
              category: true,
              fileName: true,
              fileSize: true,
              sha256Hash: true,
              ocrStatus: true,
              duplicateOfId: true,
              issueDate: true,
              expiryDate: true,
              createdAt: true,
            },
          },
          findings: {
            select: {
              id: true,
              ruleId: true,
              severity: true,
              status: true,
              title: true,
            },
          },
          sourceChecks: {
            select: {
              id: true,
              sourceProvider: true,
              status: true,
              verifiedAt: true,
            },
          },
          _count: {
            select: {
              documents: true,
              findings: true,
              sourceChecks: true,
            },
          },
        },
      }),
      prisma.institutionApplication.count({
        where: {
          organizationId: user.organizationId,
          validationStatus: { in: ["DRAFT", "VALIDATION_PENDING", "SUBMITTED"] },
        },
      }),
      prisma.institutionApplication.count({
        where: {
          organizationId: user.organizationId,
          validationStatus: { in: ["RECTIFICATION_REQUESTED", "OFFICIAL_REVIEW_REQUIRED"] },
        },
      }),
      prisma.institutionApplication.count({
        where: {
          organizationId: user.organizationId,
          validationStatus: "READY_FOR_OFFICIAL_SCRUTINY",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      metrics: {
        total,
        pendingValidationCount,
        flaggedCount,
        readyCount,
      },
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET_INSTITUTION_APPLICATIONS]", error);
    return NextResponse.json({ error: "Failed to retrieve applications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      institutionName,
      permanentId,
      applicationCategory,
      academicYear,
      previousApprovalRef,
      previousApprovalStatus,
      institutionRecordStatus,
      terFeeStatus,
      terFeeReference,
      approvedIntake,
      requestedIntake,
      facultyCount,
      requiredFacultyCount,
      infrastructureSubmitted,
      reviewerNotes,
    } = body;

    if (!institutionName || !permanentId || !applicationCategory) {
      return NextResponse.json(
        { error: "institutionName, permanentId, and applicationCategory are required fields" },
        { status: 400 }
      );
    }

    // Generate unique official case number e.g. APP-2026-AICTE-84912
    const randomSuffix = crypto.randomInt(10000, 99999);
    const applicationNumber = `APP-2026-AICTE-${randomSuffix}`;

    const application = await prisma.institutionApplication.create({
      data: {
        applicationNumber,
        institutionName: institutionName.trim(),
        permanentId: permanentId.trim(),
        applicationCategory,
        academicYear: academicYear || "2026-2027",
        previousApprovalRef: previousApprovalRef?.trim() || null,
        previousApprovalStatus: previousApprovalStatus || "APPROVED",
        institutionRecordStatus: institutionRecordStatus || "ACTIVE",
        terFeeStatus: terFeeStatus || "PENDING",
        terFeeReference: terFeeReference?.trim() || null,
        approvedIntake: Number(approvedIntake) || 0,
        requestedIntake: Number(requestedIntake) || 0,
        facultyCount: Number(facultyCount) || 0,
        requiredFacultyCount: Number(requiredFacultyCount) || 0,
        infrastructureSubmitted: Boolean(infrastructureSubmitted),
        reviewerNotes: reviewerNotes?.trim() || null,
        validationStatus: "DRAFT",
        complianceScore: 0,
        organizationId: user.organizationId,
        creatorId: user.id,
      },
    });

    await recordAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      userEmail: user.email,
      action: "INSTITUTION_APPLICATION_CREATED",
      resourceType: "INSTITUTION_APPLICATION",
      resourceId: application.applicationNumber,
      details: `Created institutional application case for ${institutionName} (${applicationCategory}).`,
    });

    return NextResponse.json({ success: true, data: application });
  } catch (error) {
    console.error("[POST_INSTITUTION_APPLICATIONS]", error);
    return NextResponse.json({ error: "Failed to create institutional application" }, { status: 500 });
  }
}
