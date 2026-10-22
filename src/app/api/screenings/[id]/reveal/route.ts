import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit/logger";
import { hasPermission } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized. Authentication required to reveal protected identity data." },
        { status: 401 }
      );
    }

    if (!hasPermission(currentUser.role, "pii:unmask")) {
      return NextResponse.json(
        { error: "Forbidden: Authorized Reviewer or Administrator credentials required to unmask statutory PII." },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason?.trim();

    if (!reason || reason.length < 5) {
      return NextResponse.json(
        { error: "Operational justification (min 5 characters) is mandatory to unmask statutory identifiers." },
        { status: 400 }
      );
    }

    const session = await prisma.screeningSession.findFirst({
      where: {
        OR: [{ id }, { screeningId: id }],
        organizationId: currentUser.organizationId, // Tenant boundary enforcement
      },
      include: { extractedFields: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Screening record not found." }, { status: 404 });
    }

    // Unmask sensitive fields for this authorized request
    const revealedFields = session.extractedFields.map((field) => ({
      id: field.id,
      key: field.fieldKey,
      label: field.fieldLabel,
      value: field.rawValue,
      maskedValue: field.maskedValue,
      isSensitive: field.isSensitive,
    }));

    await recordAuditLog({
      organizationId: session.organizationId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: "SENSITIVE_PII_UNMASKED",
      resourceType: "SCREENING_SESSION",
      resourceId: session.screeningId,
      details: `Operator [${currentUser.name} / ${currentUser.role}] unmasked protected identifiers. Justification: ${reason}`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      revealedFields,
      message: "Sensitive fields temporarily revealed for authorized operator. Action recorded in audit log.",
    });
  } catch (error: any) {
    console.error("[PII_REVEAL_ERROR]", error);
    return NextResponse.json({ error: "Failed to reveal sensitive fields." }, { status: 500 });
  }
}
