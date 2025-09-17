// src/app/api/files/epub/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { dbConnect } from "@/lib/db";
import { getGridFSBucket } from "@/lib/gridfs";
import { Readable } from "stream"; // use 'stream' alias for Node
// We deliberately do NOT import ReadableStream from 'node:stream/web'
// because Next expects the DOM ReadableStream type.

export const runtime = "nodejs";

type DomReadableStream = ReadableStream<Uint8Array>;

function toDomReadable(nodeStream: NodeJS.ReadableStream): DomReadableStream {
  // Node 18+: Readable.toWeb returns a web stream, but typed as node's Web stream.
  // We cast to the DOM lib type that NextResponse expects.
  // @ts-expect-error – Node's type for Readable.toWeb differs from DOM lib, runtime is correct.
  return Readable.toWeb(nodeStream) as unknown as DomReadableStream;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const bucket = await getGridFSBucket();

  const { id } = await ctx.params;

  const _id = new ObjectId(id.replace(".epub", "")); // tolerate trailing .epub
  const file = await bucket.find({ _id }).next();
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const size = Number((file as any).length || 0);
  const contentType = (file as any).contentType || "application/epub+zip";
  const range = req.headers.get("range");

  const baseHeaders: Record<string, string> = {
    "Accept-Ranges": "bytes",
    "Content-Type": contentType,
    "Cache-Control": "private, max-age=0, must-revalidate",
  };

  if (range) {
    // e.g., "bytes=0-"
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match && match[1] ? parseInt(match[1], 10) : 0;
    const end = match && match[2] ? Math.min(parseInt(match[2], 10), size - 1) : size - 1;

    if (start >= size || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes */${size}`,
        },
      });
    }

    const download = bucket.openDownloadStream(_id, { start, end: end + 1 });
    const webStream = toDomReadable(download);

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
  const webStream = toDomReadable(download);

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      ...baseHeaders,
      "Content-Length": String(size),
    },
  });
}
