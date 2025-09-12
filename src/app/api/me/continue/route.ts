import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import ReadingProgress, { ReadingProgressDoc } from "@/models/readingprogress";
import Book, { BookDoc } from "@/models/book";
import { getServerAuthSession } from "@/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerAuthSession();
  const jar = await cookies();
  const userKey = session?.user?.id || jar.get("guestId")?.value;
  if (!userKey) return NextResponse.json({ lastRead: null });

  await dbConnect();

  // 👇 tell lean() exactly what shape we expect
  const prog = await ReadingProgress
    .findOne({ userKey })
    .sort({ updatedAt: -1 })
    .lean<ReadingProgressDoc | null>();

  if (!prog) return NextResponse.json({ lastRead: null });

  const book = await Book.findById(prog.bookId)
    .select({ title: 1, author: 1 })
    .lean<BookDoc | null>();

  if (!book) return NextResponse.json({ lastRead: null });

  const raw = typeof prog.percentage === "number" ? prog.percentage : 0;
  const display = raw > 0 && raw < 1 ? 1 : Math.round(raw);

  return NextResponse.json({
    lastRead: {
      bookId: String(prog.bookId),
      title: book.title,
      author: book.author,
      percentage: display,
    },
  });
}
