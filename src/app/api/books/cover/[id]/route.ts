import { NextRequest, NextResponse } from "next/server";
import { getGridFSBucket } from "@/lib/gridfs";
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
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

    const file = files[0];
    const contentType = file.metadata?.contentType || 'image/jpeg';

    // Stream the file
    const downloadStream = bucket.openDownloadStream(objectId);
    
    const chunks: Buffer[] = [];
    
    await new Promise((resolve, reject) => {
      downloadStream.on('data', (chunk) => chunks.push(chunk));
      downloadStream.on('end', resolve);
      downloadStream.on('error', reject);
    });

    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });

  } catch (error) {
    console.error("Error serving cover:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export const runtime = "edge";