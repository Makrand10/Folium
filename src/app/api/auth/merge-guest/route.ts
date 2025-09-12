import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import ReadingProgress from "@/models/readingprogress";
import { getServerAuthSession } from "@/auth";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const jar = await cookies();
  const guestId = jar.get("guestId")?.value;
  if (!guestId) return NextResponse.json({ ok: true, merged: 0 });

  await dbConnect();
  const result = await ReadingProgress.updateMany(
    { userKey: guestId },
    { $set: { userKey: session.user.id }, $currentDate: { updatedAt: true } }
  );

  const res = NextResponse.json({ ok: true, merged: result.modifiedCount || 0 });
  res.cookies.set("guestId", "", { path: "/", maxAge: 0 });
  return res;
}
