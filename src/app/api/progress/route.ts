// src/app/api/progress/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { dbConnect } from "@/lib/db";
import ReadingProgress, { type ReadingProgressDoc } from "@/models/readingprogress";
import { getServerAuthSession } from "@/auth";

export const runtime = "nodejs";

// Save / update progress
export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {}

  const bookId = body?.bookId as string | undefined;
  if (!bookId) {
    return NextResponse.json({ error: "bookId required" }, { status: 400 });
  }

  const cfi = (body?.cfi ?? null) as string | null;
  const percentage =
    typeof body?.percentage === "number" ? (body.percentage as number) : null;

  await dbConnect();

  const session = await getServerAuthSession();
  const jar = await cookies();
  let userKey = session?.user?.id || jar.get("guestId")?.value;

  // We may need to set a guest cookie on first save
  const res = NextResponse.json({ ok: true });

  if (!userKey) {
    userKey = crypto.randomUUID();
    res.cookies.set("guestId", userKey, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  await ReadingProgress.updateOne(
    { userKey, bookId },
    {
      $set: { cfi, percentage },
      $currentDate: { updatedAt: true }, // keep "latest" sorting correct
    },
    { upsert: true }
  );

  return res;
}

// Read saved progress (for a single book)
export async function GET(req: Request) {
  const session = await getServerAuthSession();
  const jar = await cookies();
  const userKey = session?.user?.id || jar.get("guestId")?.value;
  if (!userKey) return NextResponse.json({ progress: null });

  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");
  if (!bookId) return NextResponse.json({ progress: null });

  await dbConnect();

  const prog = await ReadingProgress
    .findOne({ userKey, bookId })
    .lean<ReadingProgressDoc | null>();

  if (!prog) return NextResponse.json({ progress: null });

  return NextResponse.json({
    progress: {
      cfi: prog.cfi ?? null,
      percentage: typeof prog.percentage === "number" ? prog.percentage : 0,
    },
  });
}
