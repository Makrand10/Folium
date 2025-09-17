import { NextRequest, NextResponse } from "next/server";
import { getGridFSBucket } from "@/lib/gridfs";
import { ObjectId } from "mongodb";

export const runtime = "nodejs"; // GridFS + Buffer require Node runtime

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    if (!ObjectId.isValid(id)) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    const bucket = await getGridFSBucket();
    const objectId = new ObjectId(id);

    // Find the file
    const files = await bucket.find({ _id: objectId }).toArray();
    if (files.length === 0) {
      return new NextResponse("Cover not found", { status: 404 });
    }

    const file = files[0] as any; // metadata is not strongly typed on the cursor
    const contentType = file.metadata?.contentType || "image/jpeg";

    // Stream the file into memory (small images only; OK for covers)
    const downloadStream = bucket.openDownloadStream(objectId);
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      downloadStream.on("data", (chunk) => chunks.push(chunk));
      downloadStream.on("end", () => resolve());
      downloadStream.on("error", (err) => reject(err));
    });

    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Error serving cover:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
