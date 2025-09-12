// src/lib/db.ts
import mongoose from "mongoose";

let isConnected = 0;

export async function dbConnect() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");
  const conn = await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || undefined,
  });
  isConnected = conn.connection.readyState;
}
