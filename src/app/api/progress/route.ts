// src/app/api/progress/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { dbConnect } from "@/lib/db";
import ReadingProgress from "@/models/readingprogress";

export const runtime = "nodejs";

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
      $currentDate: { updatedAt: true },
    },
    { upsert: true }
  );

  return res;
}

// GET unchanged (your current version is fine)
