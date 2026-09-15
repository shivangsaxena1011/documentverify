import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { TrishulIntegrationClient } from "@/lib/trishul/trishul-client";
import { recordAuditLog } from "@/lib/audit/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await prisma.screeningSession.findFirst({
      where: { OR: [{ id }, { screeningId: id }] },
    });

    if (!session) {
      return NextResponse.json({ error: "Screening record not found." }, { status: 404 });
    }

    const client = new TrishulIntegrationClient();
    const receipt = await client.dispatchScreeningRecord(session.id);

    const currentUser = await getCurrentUser();
    await recordAuditLog({
      organizationId: session.organizationId,
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      action: "TRISHUL_INTELLIGENCE_DISPATCHED",
      resourceType: "SCREENING_SESSION",
      resourceId: session.screeningId,
      details: `Structured evidence package dispatched to TRISHUL Hub. Transaction ID: ${receipt.trishulTransactionId}`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      receipt,
      message: "Screening intelligence successfully transmitted to TRISHUL Intelligence Platform.",
    });
  } catch (error: any) {
    console.error("[TRISHUL_DISPATCH_ERROR]", error);
    return NextResponse.json({ error: "Failed to dispatch to TRISHUL Platform." }, { status: 500 });
  }
}
