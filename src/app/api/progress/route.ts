// src/app/api/progress/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { dbConnect } from "@/lib/db";
import ReadingProgress, { ReadingProgressDoc } from "@/models/readingprogress";

export const runtime = "nodejs";

// Save progress
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.bookId) {
    return NextResponse.json({ error: "bookId required" }, { status: 400 });
  }

  await dbConnect();

  const jar = await cookies();
  let userKey = jar.get("guestId")?.value;

  const res = NextResponse.json({ ok: true });

  if (!userKey) {
    userKey = crypto.randomUUID();
    res.cookies.set("guestId", userKey, {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365,
    });
  }

  await ReadingProgress.updateOne(
    { userKey, bookId: body.bookId },
    {
      $set: { cfi: body.cfi ?? null, percentage: body.percentage ?? null },
      $currentDate: { updatedAt: true }, // <— force timestamp bump
    },
    { upsert: true }
  );

  return res;
}

// Read saved progress for one book (resume)
export async function GET(req: Request) {
  const jar = await cookies();
  const userKey = jar.get("guestId")?.value;
  if (!userKey) return NextResponse.json({ progress: null });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");
  if (!bookId) return NextResponse.json({ progress: null });

  const prog = await ReadingProgress
    .findOne({ userKey, bookId })
    .lean<ReadingProgressDoc | null>();

  if (!prog) return NextResponse.json({ progress: null });

  return NextResponse.json({
    progress: { cfi: prog.cfi ?? null, percentage: prog.percentage ?? 0 },
  });
}
