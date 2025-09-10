// lib/gridfs.ts
import { dbConnect } from "@/lib/db";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let bucket: GridFSBucket | null = (global as any)._gridfsBucket || null;

export async function getGridFSBucket() {
  await dbConnect();

  if (bucket) {
    return bucket;
  }

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB database connection is not available.");
  }

  bucket = new GridFSBucket(db, { bucketName: "epubs" });
  (global as any)._gridfsBucket = bucket;

  return bucket;
}