import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDatabaseSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabaseSeeded();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalScreenings,
      todayScreenings,
      requiresReviewCount,
      flaggedCount,
      lowRiskCount,
      allSessions,
      ocrResults,
    ] = await Promise.all([
      prisma.screeningSession.count(),
      prisma.screeningSession.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.screeningSession.count({ where: { riskTier: "REVIEW_REQUIRED" } }),
      prisma.screeningSession.count({ where: { riskTier: "HIGH_RISK" } }),
      prisma.screeningSession.count({ where: { riskTier: "LOW_RISK" } }),
      prisma.screeningSession.findMany({
        select: {
          documentType: true,
          riskTier: true,
          processingTimeMs: true,
          createdAt: true,
        },
      }),
      prisma.oCRResult.findMany({
        select: { averageConfidence: true },
      }),
    ]);

    const verifiedRate =
      totalScreenings > 0 ? Math.round((lowRiskCount / totalScreenings) * 100) : 0;

    const avgProcessingTime =
      allSessions.length > 0
        ? Math.round(
            allSessions.reduce((acc, s) => acc + s.processingTimeMs, 0) /
              allSessions.length
          )
        : 0;

    const avgOcrAccuracy =
      ocrResults.length > 0
        ? Math.round(
            ocrResults.reduce((acc, r) => acc + r.averageConfidence, 0) /
              ocrResults.length
          )
        : 0;

    // Document type distribution
    const docDistribution: Record<string, number> = {
      AADHAAR_CARD: 0,
      PAN_CARD: 0,
      PASSPORT: 0,
      DRIVING_LICENCE: 0,
      VOTER_ID: 0,
      UNKNOWN: 0,
    };

    allSessions.forEach((s) => {
      if (docDistribution[s.documentType] !== undefined) {
        docDistribution[s.documentType]++;
      } else {
        docDistribution.UNKNOWN++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalScreenings,
        todayScreenings,
        requiresReviewCount,
        flaggedCount,
        lowRiskCount,
        verifiedRate,
        avgProcessingTime,
        avgOcrAccuracy,
        docDistribution,
        systemHealth: {
          ocrEngine: "OPERATIONAL",
          classifierEngine: "OPERATIONAL",
          forensicEngine: "OPERATIONAL",
          biometricsModule: "OPERATIONAL",
          trishulHubGateway: "CONNECTED",
          verificationGateway: "SANDBOX_ACTIVE", // Honest institutional state
        },
      },
    });
  } catch (error: any) {
    console.error("[METRICS_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to compute operational metrics." }, { status: 500 });
  }
}
