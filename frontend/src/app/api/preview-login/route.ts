import { NextRequest, NextResponse } from "next/server";

const PREVIEW_PASSWORD = process.env.PREVIEW_PASSWORD || "";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!PREVIEW_PASSWORD || password !== PREVIEW_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("ds_preview_access", PREVIEW_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
