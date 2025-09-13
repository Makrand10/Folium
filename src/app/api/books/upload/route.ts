// src/app/api/books/upload/route.ts

import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { dbConnect } from "@/lib/db";
import { getGridFSBucket } from "@/lib/gridfs";
import Book from "@/models/book";
import { getServerAuthSession } from "@/auth";
import { extractEpubCover } from "@/lib/epub-cover";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const title = String(form.get("title") ?? "Untitled");
  const author = String(form.get("author") ?? "Unknown");

  if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });

  await dbConnect();
  const bucket = await getGridFSBucket();

  // Convert file to buffer for cover extraction
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Extract cover before storing the EPUB
  const { coverBuffer, mimeType } = await extractEpubCover(buffer);

  // Store EPUB file in GridFS (using your existing logic)
  const filename = `${crypto.randomUUID()}.epub`;
  const contentType = file.type || "application/epub+zip";
  
  const upload = bucket.openUploadStream(filename, {
    contentType,
    metadata: { title, author },
  });

  // Convert buffer back to stream for GridFS upload
  const nodeStream = Readable.from(buffer);
  
  await new Promise<void>((resolve, reject) => {
    nodeStream.pipe(upload).on("error", reject).on("finish", () => resolve());
  });

  const fileId = upload.id as ObjectId;

  // Prepare cover URL if cover was found
  let coverUrl: string | undefined;
  
  if (coverBuffer && mimeType) {
    // Store as base64 data URL (simpler approach)
    const base64Cover = coverBuffer.toString('base64');
    coverUrl = `data:${mimeType};base64,${base64Cover}`;
  }

  // Create book record with cover
  const book = await Book.create({ 
    title, 
    author, 
    fileId,
    coverUrl,
    ownerId: session.user.id, // Add this line
  });

  return NextResponse.json({ book }, { status: 201 });
}