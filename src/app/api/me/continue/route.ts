import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // TODO: Return the authenticated user's lastRead info
  return NextResponse.json({ lastRead: null });
}
