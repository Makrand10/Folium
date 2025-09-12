// src/app/api/me/books/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { dbConnect } from "@/lib/db";
import ReadingProgress, { ReadingProgressDoc } from "@/models/readingprogress";
import Book, { BookDoc } from "@/models/book";

export const runtime = "nodejs";

export async function GET() {
  const jar = await cookies();
  let userKey = jar.get("guestId")?.value;
  
  const res = NextResponse.json({ books: [] });
  
  // Create guestId if it doesn't exist (same logic as other routes)
  if (!userKey) {
    userKey = crypto.randomUUID();
    res.cookies.set("guestId", userKey, {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365,
    });
    return res; // Return empty array since there's no progress yet
  }

  await dbConnect();

  // Get all reading progress for this user, sorted by most recent
  const progressList = await ReadingProgress
    .find({ userKey })
    .sort({ updatedAt: -1 })
    .lean<ReadingProgressDoc[]>();

  console.log(`Found ${progressList.length} progress records for userKey: ${userKey}`);
  console.log('Progress records:', progressList.map(p => ({ bookId: p.bookId, percentage: p.percentage, updatedAt: p.updatedAt })));

  if (progressList.length === 0) {
    return res;
  }

  // Get all book IDs from progress
  const bookIds = progressList.map(p => p.bookId);
  
  // Fetch all books that have progress
  const books = await Book.find({ _id: { $in: bookIds } })
    .select({ title: 1, author: 1, fileId: 1, coverUrl: 1 })
    .lean<BookDoc[]>();

  // Create a map for quick book lookup
  const bookMap = new Map(books.map(book => [String(book._id), book]));

  // Combine progress with book data
  const booksWithProgress = progressList
    .map(progress => {
      const book = bookMap.get(String(progress.bookId));
      if (!book) return null;

      const raw = typeof progress.percentage === "number" ? progress.percentage : 0;
      // Don't round to 1% if it's actually 0 - only if it's between 0 and 1
      const display = raw > 0 && raw < 1 ? 1 : raw;

      return {
        bookId: String(progress.bookId),
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        percentage: display,
        lastRead: progress.updatedAt,
        cfi: progress.cfi,
      };
    })
    .filter(Boolean); // Remove null entries

  return NextResponse.json({ books: booksWithProgress });
}
