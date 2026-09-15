import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const action = searchParams.get("action") || "";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const where: any = {};
    if (action && action !== "ALL") {
      where.action = action;
    }
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { userEmail: { contains: search } },
        { resourceId: { contains: search } },
        { details: { contains: search } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { timestamp: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: logs,
    });
  } catch (error: any) {
    console.error("[AUDIT_LOGS_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to retrieve audit log records." }, { status: 500 });
  }
}
