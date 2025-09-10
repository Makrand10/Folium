import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // TODO: Implement with NextAuth + User.lastRead / ReadingProgress
  // For now, accept payload and return ok so UI can proceed.
  const _payload = await req.json().catch(() => ({}));
  return NextResponse.json({ ok: true });
}
