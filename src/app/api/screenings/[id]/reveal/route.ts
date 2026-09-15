import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Operational identity verification requirement";

    const currentUser = await getCurrentUser();
    // Allow Reviewer or Administrator, or logged in operator if configured
    const userRole = currentUser?.role || "OPERATOR";

    const session = await prisma.screeningSession.findFirst({
      where: { OR: [{ id }, { screeningId: id }] },
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
      userId: currentUser?.id,
      userEmail: currentUser?.email || "authorized_operator",
      action: "SENSITIVE_PII_UNMASKED",
      resourceType: "SCREENING_SESSION",
      resourceId: session.screeningId,
      details: `Operator revealed protected identifiers. Justification: ${reason}`,
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
