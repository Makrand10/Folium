// src/app/api/books/[id]/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Book, { BookDoc } from "@/models/book";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }   // Next 15: params is a Promise
) {
  const { id } = await ctx.params;
  await dbConnect();

  const book = await Book.findById(id).lean<BookDoc | null>();
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 👇 add .epub so epub.js recognizes it as a zip package
  const fileUrl = `/api/files/epub/${book.fileId}.epub`;

  return NextResponse.json({ book: { ...book, fileUrl } });
}
