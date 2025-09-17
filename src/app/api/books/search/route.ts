// src/app/api/books/search/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Book from "@/models/book";

export const runtime = "nodejs";

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit") || 24), 48);

  let docs;
  if (!q) {
    docs = await Book.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  } else {
    docs = await Book.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .lean();
  }

  const books = docs.map((b: any) => ({
    _id: String(b._id),
    title: b.title,
    author: b.author ?? "",
    coverUrl: b.coverUrl ?? "",
    description: b.description ?? "",
    fileId: String(b.fileId),
  }));

  return NextResponse.json({ books });
}
