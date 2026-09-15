import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit/logger";
import crypto from "crypto";

export async function GET() {
  try {
    const keys = await prisma.apiKey.findMany({
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
    const body = await req.json();
    const { name, scopes } = body;

    if (!name) {
      return NextResponse.json({ error: "Key name/purpose is required." }, { status: 400 });
    }

    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    // Generate random secret
    const rawSecret = `trishul_live_${crypto.randomBytes(24).toString("hex")}`;
    const keyPrefix = rawSecret.slice(0, 16) + "...";
    const hashedSecret = crypto.createHash("sha256").update(rawSecret).digest("hex");

    const newKey = await prisma.apiKey.create({
      data: {
        organizationId: org.id,
        name,
        keyPrefix,
        hashedSecret,
        scopes: scopes || "screenings:read,screenings:write",
      },
    });

    const currentUser = await getCurrentUser();
    await recordAuditLog({
      organizationId: org.id,
      userId: currentUser?.id,
      action: "API_KEY_GENERATED",
      resourceType: "API_KEY",
      resourceId: newKey.id,
      details: `Generated API key '${name}' with scopes: ${scopes || "default"}.`,
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "API Key ID required." }, { status: 400 });
    }

    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) {
      return NextResponse.json({ error: "API key not found." }, { status: 404 });
    }

    await prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    const currentUser = await getCurrentUser();
    await recordAuditLog({
      organizationId: key.organizationId,
      userId: currentUser?.id,
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
