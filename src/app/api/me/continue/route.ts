import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import ReadingProgress, { ReadingProgressDoc } from "@/models/readingprogress";
import Book, { BookDoc } from "@/models/book";

export const runtime = "nodejs";

export async function GET() {
  const jar = await cookies();
  const userKey = jar.get("guestId")?.value;
  if (!userKey) return NextResponse.json({ lastRead: null });

  await dbConnect();

  const prog = await ReadingProgress
    .findOne({ userKey })
    .sort({ updatedAt: -1 })
    .lean<ReadingProgressDoc | null>();
  if (!prog) return NextResponse.json({ lastRead: null });

  const book = await Book.findById(prog.bookId)
    .select({ title: 1, author: 1 })
    .lean<BookDoc | null>();
  if (!book) return NextResponse.json({ lastRead: null });

  // 👇 force number (handles string/undefined)
  const pct = Number(prog.percentage ?? 0);
  return NextResponse.json({
    lastRead: {
      bookId: String(prog.bookId),
      title: book.title,
      author: book.author,
      percentage: Number.isFinite(pct) ? Math.round(pct) : 0,
    },
  });
}
