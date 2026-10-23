import { ensureDatabaseSeeded } from "@/lib/seed";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createToken, getSessionCookieOptions } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit/logger";
import { UserRole } from "@/lib/auth/roles";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "_trishul_salt_2026").digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    let normalizedEmail = (email || "").trim().toLowerCase();
    if (normalizedEmail === "administrator@trishul-intel.org") {
      normalizedEmail = "admin@trishul-intel.org";
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Both institutional email/operator ID and password are required." },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid operator credentials." }, { status: 401 });
    }

    const providedHash = hashPassword(password);
    const expectedHash = user.passwordHash;

    const providedBuffer = Buffer.from(providedHash);
    const expectedBuffer = Buffer.from(expectedHash);

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      return NextResponse.json({ error: "Invalid operator credentials." }, { status: 401 });
    }

    // Role is strictly derived from the database, never from client override
    const activeRole = user.role as UserRole;

    const token = createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: activeRole,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
    });

    const cookieOptions = getSessionCookieOptions();

    await recordAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      userEmail: user.email,
      action: "USER_AUTHENTICATION_SUCCESS",
      resourceType: "USER",
      resourceId: user.id,
      details: `Operator signed in with verified credentials (Role: ${activeRole}).`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: activeRole,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          code: user.organization.code,
        },
      },
    });

    response.cookies.set(cookieOptions.name, token, cookieOptions.options);
    return response;
  } catch (error: any) {
    console.error("[LOGIN_ERROR]", error);
    return NextResponse.json({ error: "Authentication service error. Please try again." }, { status: 500 });
  }
}
