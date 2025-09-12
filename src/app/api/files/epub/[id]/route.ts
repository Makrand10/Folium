// src/app/api/files/epub/[id]/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { dbConnect } from "@/lib/db";
import { getGridFSBucket } from "@/lib/gridfs";
import { Readable } from "node:stream";

export const runtime = "nodejs";

function toWebReadable(nodeStream: NodeJS.ReadableStream): ReadableStream<Uint8Array> {
  // Node 18+: convert to web stream
  // @ts-ignore
  return Readable.toWeb(nodeStream);
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const bucket = await getGridFSBucket();

  const _id = new ObjectId(params.id.replace(".epub", "")); // tolerate trailing .epub
  const file = await bucket.find({ _id }).next();
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const size = Number(file.length || 0);
  const contentType = file.contentType || "application/epub+zip";
  const range = req.headers.get("range");

  // Always advertise that we support range
  const baseHeaders = {
    "Accept-Ranges": "bytes",
    "Content-Type": contentType,
    "Cache-Control": "private, max-age=0, must-revalidate",
  } as Record<string, string>;

  // Partial content
  if (range) {
    // e.g., "bytes=0-"
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match && match[1] ? parseInt(match[1], 10) : 0;
    const end =
      match && match[2] ? Math.min(parseInt(match[2], 10), size - 1) : size - 1;

    if (start >= size || start > end) {
      return new NextResponse(null, {
        status: 416, // Range Not Satisfiable
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes */${size}`,
        },
      });
    }

    const download = bucket.openDownloadStream(_id, { start, end: end + 1 });
    const webStream = toWebReadable(download);

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${size}`,
      },
    });
  }

  // Full content
  const download = bucket.openDownloadStream(_id);
  const webStream = toWebReadable(download);

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      ...baseHeaders,
      "Content-Length": String(size),
    },
  });
}
