// src/app/api/books/my-library/route.ts
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { dbConnect } from "@/lib/db";
import Book from "@/models/book";
import ReadingProgress from "@/models/readingprogress";
import User from "@/models/user";
import { Types, Document } from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const userId = session.user.id;

  // Type assertion to tell TypeScript that the result will have a bookIds array
  const user = (await User.findById(userId).populate({
    path: "bookIds",
    model: "Book",
  }).lean()) as (typeof User.schema extends Document ? any : any) & { bookIds: any[] };

  if (!user || !user.bookIds || user.bookIds.length === 0) {
    return NextResponse.json({ books: [] });
  }

  const books = user.bookIds;

  const progress = await ReadingProgress.find({ userKey: userId }).lean();

  const progressMap = new Map<string, any>();
  progress.forEach((p) => progressMap.set((p.bookId as Types.ObjectId).toString(), p));

  const booksWithProgress = books.map((book: any) => {
    const progressData = progressMap.get((book._id as Types.ObjectId).toString());
    return {
      ...book,
      progress: progressData
        ? {
            percentage: progressData.percentage,
            cfi: progressData.cfi,
          }
        : null,
    };
  });

  return NextResponse.json({ books: booksWithProgress });
}