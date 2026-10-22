import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLE_PERMISSIONS, UserRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      ...sessionUser,
      permissions: ROLE_PERMISSIONS[sessionUser.role as UserRole] || [],
    },
  });
}
