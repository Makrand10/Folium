import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Book, { type BookDoc } from "@/models/book";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const { id } = await ctx.params;

  // Make lean() return a single typed doc
  const book = await Book.findById(id).lean<BookDoc | null>();
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
