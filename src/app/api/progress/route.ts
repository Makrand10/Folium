import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/user";
import { isValidObjectId } from "mongoose";

export async function POST(req: Request) {
  await dbConnect();
  const { userId, bookId, cfi, percentage } = await req.json();

  if (!userId || !bookId || !cfi)
    return NextResponse.json({ error: "Missing userId, bookId or cfi" }, { status: 400 });

  if (!isValidObjectId(userId) || !isValidObjectId(bookId))
    return NextResponse.json({ error: "Invalid ids" }, { status: 400 });

  await User.updateOne(
    { _id: userId },
    {
      $set: { lastRead: { bookId, cfi, percentage: Number(percentage) || 0, updatedAt: new Date() } },
      $addToSet: { library: bookId },
    }
  );

  return NextResponse.json({ ok: true });
}
