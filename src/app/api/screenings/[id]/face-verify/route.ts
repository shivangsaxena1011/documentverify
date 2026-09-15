import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { FaceVerificationEngine } from "@/lib/biometrics/face-comparison";
import { recordAuditLog } from "@/lib/audit/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { selfieImage } = body;

    if (!selfieImage) {
      return NextResponse.json({ error: "Live selfie image is required for biometric verification." }, { status: 400 });
    }

    const session = await prisma.screeningSession.findFirst({
      where: { OR: [{ id }, { screeningId: id }] },
      include: { document: true, riskAssessment: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Screening session not found." }, { status: 404 });
    }

    const result = FaceVerificationEngine.compareFaces(
      session.document?.base64Data || "doc_face_ref",
      selfieImage
    );

    // Upsert face verification record
    const faceRecord = await prisma.faceVerification.upsert({
      where: { screeningSessionId: session.id },
      create: {
        screeningSessionId: session.id,
        liveFaceCaptured: selfieImage.slice(0, 150000), // compact thumbnail
        similarityScore: result.similarityScore,
        matchStatus: result.matchStatus,
        landmarkConfidence: result.landmarkConfidence,
      },
      update: {
        liveFaceCaptured: selfieImage.slice(0, 150000),
        similarityScore: result.similarityScore,
        matchStatus: result.matchStatus,
        landmarkConfidence: result.landmarkConfidence,
        executedAt: new Date(),
      },
    });

    // Recalculate risk score if face matched or failed
    let updatedRiskScore = session.riskScore;
    if (result.matchStatus === "MATCH") {
      updatedRiskScore = Math.max(5, session.riskScore - 10);
    } else if (result.matchStatus === "NO_MATCH") {
      updatedRiskScore = Math.min(95, session.riskScore + 30);
    }

    const updatedRiskTier =
      updatedRiskScore >= 66
        ? "HIGH_RISK"
        : updatedRiskScore >= 26
        ? "REVIEW_REQUIRED"
        : "LOW_RISK";

    await prisma.screeningSession.update({
      where: { id: session.id },
      data: {
        riskScore: updatedRiskScore,
        riskTier: updatedRiskTier,
      },
    });

    const currentUser = await getCurrentUser();
    await recordAuditLog({
      organizationId: session.organizationId,
      userId: currentUser?.id,
      action: "BIOMETRIC_FACE_VERIFIED",
      resourceType: "SCREENING_SESSION",
      resourceId: session.screeningId,
      details: `Face similarity evaluated: ${result.similarityScore}% (${result.matchStatus}).`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      data: faceRecord,
      comparison: result,
      newRiskScore: updatedRiskScore,
      newRiskTier: updatedRiskTier,
    });
  } catch (error: any) {
    console.error("[FACE_VERIFY_ERROR]", error);
    return NextResponse.json({ error: "Biometric analysis failed." }, { status: 500 });
  }
}
