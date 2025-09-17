import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/user";
import { getServerAuthSession } from "@/auth";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getUserId() {
  const session = await getServerAuthSession();
  return session?.user?.id ?? null;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ bookId: string }> }
) {
  await dbConnect();
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ inLibrary: false }, { status: 401 });

  const { bookId } = await ctx.params;

  if (!Types.ObjectId.isValid(bookId)) {
    return NextResponse.json({ inLibrary: false }, { status: 400 });
    }

  // No need to read user.library; just check membership
  const exists = await User.exists({
    _id: userId,
    library: new Types.ObjectId(bookId),
  });

  return NextResponse.json({ inLibrary: !!exists });
}

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ bookId: string }> }
) {
  await dbConnect();
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const { bookId } = await ctx.params;

  if (!Types.ObjectId.isValid(bookId)) {
    return NextResponse.json({ ok: false, error: "invalid id" }, { status: 400 });
  }

  await User.updateOne(
    { _id: userId },
    { $addToSet: { library: new Types.ObjectId(bookId) } }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ bookId: string }> }
) {
  await dbConnect();
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const { bookId } = await ctx.params;

  if (!Types.ObjectId.isValid(bookId)) {
    return NextResponse.json({ ok: false, error: "invalid id" }, { status: 400 });
  }

  await User.updateOne(
    { _id: userId },
    { $pull: { library: new Types.ObjectId(bookId) } }
  );

  return NextResponse.json({ ok: true });
}
