import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { dbConnect } from "@/lib/db";
import { getGridFSBucket } from "@/lib/gridfs";
import Book from "@/models/book";
// TODO: protect with auth later

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const title = String(form.get("title") ?? "Untitled");
  const author = String(form.get("author") ?? "Unknown");

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  await dbConnect();
  const bucket = await getGridFSBucket();

  const filename = `${crypto.randomUUID()}.epub`;
  const contentType = file.type || "application/epub+zip";

  const upload = bucket.openUploadStream(filename, {
    contentType,
    metadata: { title, author }
  });

  const nodeStream = Readable.fromWeb(file.stream() as any);
  await new Promise<void>((resolve, reject) => {
    nodeStream.pipe(upload)
      .on("error", reject)
      .on("finish", () => resolve());
  });

  const fileId = upload.id as ObjectId;

  const book = await Book.create({ title, author, fileId });
  return NextResponse.json({ book }, { status: 201 });
}
