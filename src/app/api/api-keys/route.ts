import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit/logger";
import { hasPermission } from "@/lib/auth/roles";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized. Session required." }, { status: 401 });
    }

    if (currentUser.role !== "ADMINISTRATOR" && !hasPermission(currentUser.role, "api_keys:manage")) {
      return NextResponse.json(
        { error: "Forbidden: Administrator role required to view API key infrastructure." },
        { status: 403 }
      );
    }

    const keys = await prisma.apiKey.findMany({
      where: { organizationId: currentUser.organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: keys });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch API keys." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized. Session required." }, { status: 401 });
    }

    if (currentUser.role !== "ADMINISTRATOR" && !hasPermission(currentUser.role, "api_keys:manage")) {
      return NextResponse.json(
        { error: "Forbidden: Administrator credentials required to provision API keys." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, scopes } = body;

    if (!name) {
      return NextResponse.json({ error: "Key name/purpose is required." }, { status: 400 });
    }

    // Generate random secret
    const rawSecret = `trishul_live_${crypto.randomBytes(24).toString("hex")}`;
    const keyPrefix = rawSecret.slice(0, 16) + "...";
    const hashedSecret = crypto.createHash("sha256").update(rawSecret).digest("hex");

    const newKey = await prisma.apiKey.create({
      data: {
        organizationId: currentUser.organizationId,
        name,
        keyPrefix,
        hashedSecret,
        scopes: scopes || "screenings:read,screenings:write",
      },
    });

    await recordAuditLog({
      organizationId: currentUser.organizationId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: "API_KEY_GENERATED",
      resourceType: "API_KEY",
      resourceId: newKey.id,
      details: `Administrator ${currentUser.name} generated API key '${name}'.`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newKey.id,
        name: newKey.name,
        keyPrefix: newKey.keyPrefix,
        secretKey: rawSecret, // DISPLAYED ONCE
        scopes: newKey.scopes,
        createdAt: newKey.createdAt,
      },
      warning: "Ensure you copy this secret key now. In accordance with enterprise security standards, it cannot be displayed again.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create API key." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized. Session required." }, { status: 401 });
    }

    if (currentUser.role !== "ADMINISTRATOR" && !hasPermission(currentUser.role, "api_keys:manage")) {
      return NextResponse.json(
        { error: "Forbidden: Administrator credentials required to revoke API keys." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "API Key ID required." }, { status: 400 });
    }

    const key = await prisma.apiKey.findFirst({
      where: {
        id,
        organizationId: currentUser.organizationId,
      },
    });

    if (!key) {
      return NextResponse.json({ error: "API key not found." }, { status: 404 });
    }

    await prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    await recordAuditLog({
      organizationId: currentUser.organizationId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: "API_KEY_REVOKED",
      resourceType: "API_KEY",
      resourceId: key.id,
      details: `Revoked API key '${key.name}'.`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, message: "API key revoked." });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to revoke API key." }, { status: 500 });
  }
}
