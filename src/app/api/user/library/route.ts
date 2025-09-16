// src/app/api/user/library/route.ts
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { dbConnect } from "@/lib/db";
import User from "@/models/user";
import { Types } from "mongoose";

/**
 * GET /api/user/library?bookId=...
 * Returns { inLibrary: boolean } for the current user.
 */
export async function GET(req: Request) {
  const session = await getServerAuthSession();
  // For this check, return {inLibrary:false} instead of 401 if unauthenticated
  if (!session?.user?.id) {
    return NextResponse.json({ inLibrary: false }, { status: 200 });
  }

  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");
  if (!bookId) {
    return NextResponse.json({ inLibrary: false }, { status: 200 });
  }

  await dbConnect();

  try {
    // Type the lean() result so TS knows bookIds exists on the doc
    type UserBookIds = { _id: Types.ObjectId; bookIds?: Types.ObjectId[] };
    const user = await User.findById(session.user.id)
      .select({ bookIds: 1 })
      .lean<UserBookIds | null>();

    const inLibrary = Array.isArray(user?.bookIds)
      ? user!.bookIds!.some((id) => String(id) === String(bookId))
      : false;

    return NextResponse.json({ inLibrary }, { status: 200 });
  } catch (error) {
    console.error("Error checking library:", error);
    // Non-fatal for UI
    return NextResponse.json({ inLibrary: false }, { status: 200 });
  }
}

/**
 * POST /api/user/library
 * Body: { bookId: string }
 * Adds bookId to the user's bookIds (deduplicated).
 * (Your original code kept intact)
 */
export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await req.json();

  if (!bookId) {
    return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
  }

  await dbConnect();

  try {
    const bookObjectId = new Types.ObjectId(bookId);

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $addToSet: { bookIds: bookObjectId } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: "Book added to library" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding book to library:", error);
    return NextResponse.json({ error: "Failed to add book" }, { status: 500 });
  }
}
