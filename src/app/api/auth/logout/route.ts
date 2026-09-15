import { NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/auth/session";

export async function POST() {
  const cookieOptions = getSessionCookieOptions();
  const response = NextResponse.json({ success: true, message: "Session terminated." });
  response.cookies.delete(cookieOptions.name);
  return response;
}
