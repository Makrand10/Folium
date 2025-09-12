// src/app/api/books/[id]/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Book, { type BookDoc } from "@/models/book";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  // 👇 Make lean() return a single typed doc
  const book = await Book.findById(params.id).lean<BookDoc | null>();
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fileUrl = `/api/files/epub/${book.fileId}.epub`;

  return NextResponse.json({
    book: {
      _id: String(book._id),
      title: book.title,
      author: book.author ?? null,
      fileUrl,
    },
  });
}
