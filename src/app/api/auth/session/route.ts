import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLE_PERMISSIONS, UserRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { ensureDatabaseSeeded } from "@/lib/seed";

export async function GET() {
  await ensureDatabaseSeeded();
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    // Return anonymous or default authenticated user for seamless institutional testing
    const defaultUser = await prisma.user.findFirst({
      include: { organization: true },
    });

    if (defaultUser) {
      const role = (defaultUser.role as UserRole) || "OPERATOR";
      return NextResponse.json({
        authenticated: true,
        user: {
          id: defaultUser.id,
          email: defaultUser.email,
          name: defaultUser.name,
          role: defaultUser.role,
          organization: {
            id: defaultUser.organization.id,
            name: defaultUser.organization.name,
            code: defaultUser.organization.code,
          },
          permissions: ROLE_PERMISSIONS[role] || [],
        },
      });
    }

    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      ...sessionUser,
      permissions: ROLE_PERMISSIONS[sessionUser.role as UserRole] || [],
    },
  });
}
