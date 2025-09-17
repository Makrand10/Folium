// src/app/api/books/search/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Book from "@/models/book";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const rawLimit = Number(url.searchParams.get("limit"));
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 48) : 24;
    const q = (url.searchParams.get("q") || "").trim();

    let docs;

    if (q) {
      // Text search path (requires the text index; ensured in dbConnect)
      docs = await Book.find(
        { $text: { $search: q } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .lean();
    } else {
      // Default explore feed: latest books (works even if text index creation is delayed)
      docs = await Book.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    }

    const books = (docs ?? []).map((b: any) => ({
      _id: String(b._id),
      title: b.title,
      author: b.author ?? "",
      coverUrl: b.coverUrl ?? "",
      description: b.description ?? "",
      fileId: String(b.fileId),
    }));

    return NextResponse.json({ books });
  } catch (err: any) {
    console.error("GET /api/books/search error:", err?.message || err);
    // Don’t break SSR pages — return empty payload
    return NextResponse.json({ books: [], error: "search_failed" }, { status: 200 });
  }
}
