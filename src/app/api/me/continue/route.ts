import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/user";
import Book from "@/models/book";
import type { BookDoc } from "@/models/book";  // <-- use your exported type
import { Types } from "mongoose";

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({});

  // lastRead typed
  const user = await User.findById(userId)
    .select({ lastRead: 1 })
    .lean<{ _id: Types.ObjectId; lastRead?: { bookId?: Types.ObjectId; cfi?: string; percentage?: number } }>();

  const bid = user?.lastRead?.bookId;
  if (!bid) return NextResponse.json({});

  // BOOK typed (so fileId exists)
  const book = await Book.findById(bid)
    .select({ title: 1, author: 1, coverUrl: 1, fileId: 1 })
    .lean<(BookDoc & { _id: Types.ObjectId }) | null>();

  if (!book) return NextResponse.json({});

  const fileUrl = `/api/files/epub/${book.fileId.toString()}`;
  return NextResponse.json({
    book: { ...book, fileUrl },
    cfi: user!.lastRead!.cfi,
    percentage: user!.lastRead!.percentage ?? 0
  });
}
