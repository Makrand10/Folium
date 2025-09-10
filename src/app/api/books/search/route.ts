import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Book from "@/models/book";

export const runtime = "nodejs";

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    const books = await Book.find({}).sort({ createdAt: -1 }).limit(24).lean();
    return NextResponse.json({ books });
  }

  const books = await Book.find(
    { $text: { $search: q } },
    { score: { $meta: "textScore" } }
  ).sort({ score: { $meta: "textScore" } }).limit(24).lean();

  return NextResponse.json({ books });
}
