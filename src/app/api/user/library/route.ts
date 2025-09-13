// src/app/api/user/library/route.ts
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { dbConnect } from "@/lib/db";
import User from "@/models/user";
import { Types } from "mongoose";

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

    // Find the user and add the bookId to the bookIds array if it's not already there.
    // The $addToSet operator handles the case where the array doesn't exist.
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $addToSet: { bookIds: bookObjectId } },
      { new: true } // Return the updated document
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Book added to library" }, { status: 200 });

  } catch (error) {
    console.error("Error adding book to library:", error);
    return NextResponse.json({ error: "Failed to add book" }, { status: 500 });
  }
}