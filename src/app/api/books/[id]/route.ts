// src/app/api/books/[id]/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Book from "@/models/book";
import type { BookDoc } from "@/models/book";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // `lean<T>()` generic can be flaky depending on mongoose types.
    // Query, then cast the result to the expected type.
    const book = (await Book.findById(id).lean().exec()) as BookDoc | null;

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json({ book });
  } catch (err: any) {
    console.error("GET /api/books/[id] error:", err?.message || err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
