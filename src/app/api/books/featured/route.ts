// src/app/api/books/featured/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Book from "@/models/book";

export const runtime = "nodejs";

export async function GET() {
  await dbConnect();

  // Prefer a random book that has a description; fallback to most recent
  const [withDesc] = await Book.aggregate([
    { $match: { description: { $exists: true, $type: "string", $ne: "" } } },
    { $sample: { size: 1 } },
  ]);

  let book = withDesc;
  if (!book) {
    book = await Book.findOne({}).sort({ createdAt: -1 }).lean();
  }

  if (!book) {
    return NextResponse.json({ book: null });
  }

  // Normalize _id to string for client
  const normalized = {
    _id: String(book._id),
    title: book.title,
    author: book.author ?? "",
    description: book.description ?? "",
    coverUrl: book.coverUrl ?? "",
    fileId: String(book.fileId),
  };

  return NextResponse.json({ book: normalized });
}
