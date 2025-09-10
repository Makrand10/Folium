// src/app/api/files/epub/[id]/route.ts
import { getGridFSBucket } from "@/lib/gridfs";
import { getDb } from "@/lib/db";
import Book, { BookDoc } from "@/models/book";
import { ObjectId } from "mongodb";
import { Readable } from "node:stream";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const cleanId = id.toLowerCase().endsWith(".epub") ? id.slice(0, -5) : id;

  let fileId: ObjectId;
  try {
    fileId = new ObjectId(cleanId);
  } catch {
    return new Response("Invalid id", { status: 400 });
  }

  const bucket = await getGridFSBucket();

  const book = await Book.findOne({ fileId }).lean<BookDoc | null>();
  if (!book) return new Response("Not found", { status: 404 });

  // ✅ native Db so .collection() works
  const db = await getDb();
  const fileDoc = await db
    .collection<{ length: number; contentType?: string; filename?: string }>("epubs.files")
    .findOne({ _id: fileId });
  if (!fileDoc) return new Response("Not found", { status: 404 });

  const total = fileDoc.length;
  const contentType = fileDoc.contentType || "application/epub+zip";
  const filename = `${book.title || fileDoc.filename || "book"}.epub`;
  const etag = `"${fileId.toHexString()}"`;

  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304 });
  }

  const range = req.headers.get("range");
  if (range) {
    const m = range.match(/bytes=(\d+)-(\d+)?/);
    if (!m) return new Response("Bad Range", { status: 416 });

    const start = parseInt(m[1], 10);
    const end = m[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
    if (start >= total || start < 0 || end < start) {
      return new Response("Requested Range Not Satisfiable", { status: 416 });
    }

    const stream = bucket.openDownloadStream(fileId, { start, end: end + 1 });
    const webStream = Readable.toWeb(stream as any) as ReadableStream;

    return new Response(webStream, {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Content-Length": String(end - start + 1),
        "Cache-Control": "private, max-age=3600",
        "ETag": etag,
        "X-Content-Type-Options": "nosniff"
      }
    });
  }

  const stream = bucket.openDownloadStream(fileId);
  const webStream = Readable.toWeb(stream as any) as ReadableStream;

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Accept-Ranges": "bytes",
      "Content-Length": String(total),
      "Cache-Control": "private, max-age=3600",
      "ETag": etag,
      "X-Content-Type-Options": "nosniff"
    }
  });
}
