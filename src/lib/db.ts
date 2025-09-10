// src/lib/db.ts
import mongoose from "mongoose";
import type { Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("MONGODB_URI not set in .env.local");

// cache the connection across hot reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | null | undefined;
}

let conn: typeof mongoose | null = global._mongooseConn ?? null;

/** Idempotent mongoose connect */
export async function dbConnect(): Promise<typeof mongoose> {
  // 1 = connected, 2 = connecting
  if (conn && mongoose.connection.readyState === 1) return conn;
  if (mongoose.connection.readyState === 2) return mongoose;

  conn = await mongoose.connect(MONGODB_URI, { dbName: "book_reader" });
  global._mongooseConn = conn;
  return conn;
}

/** Guaranteed native Mongo Db (fixes TS 'possibly undefined' on mongoose.connection.db) */
export async function getDb(): Promise<Db> {
  await dbConnect();
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection not ready");
  return db;
}
