// src/lib/library.ts
import { dbConnect} from "@/lib/db";           // your existing connector
import ReadingProgress from "@/models/readingprogress";
import Book from "@/models/book";

export type LibraryItem = {
  book: any;              // you can replace with your Book type
  progress: { percentage?: number; updatedAt?: Date; cfi?: string };
};

export async function getUserLibrary(userId: string): Promise<{
  lastRead: LibraryItem | null;
  items: LibraryItem[];
}> {
  await dbConnect();

  const progresses = await ReadingProgress.find({ userId })
    .sort({ updatedAt: -1 })
    .lean();

  if (!progresses.length) return { lastRead: null, items: [] };

  const bookIds = progresses.map((p: any) => p.bookId);
  const books = await Book.find({ _id: { $in: bookIds } }).lean();

  const bookMap = new Map(books.map((b: any) => [String(b._id), b]));
  const items = progresses
    .map((p: any) => {
      const book = bookMap.get(String(p.bookId));
      return book ? ({ book, progress: p } as LibraryItem) : null;
    })
    .filter(Boolean) as LibraryItem[];

  return { lastRead: items[0] ?? null, items };
}
