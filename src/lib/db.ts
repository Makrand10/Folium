// src/lib/db.ts
import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
        indexesEnsured?: boolean;
      }
    | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.MONGODB_DB;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI not set");
}

// Reuse a global cache in dev & serverless to avoid multiple connections
const cached =
  (global._mongooseConn ??= { conn: null, promise: null, indexesEnsured: false });

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME || undefined,
      // serverSelectionTimeoutMS: 10000, // optional
    });
  }

  cached.conn = await cached.promise;

  // Ensure important indexes once after first successful connect
  if (!cached.indexesEnsured) {
    try {
      const { default: Book } = await import("@/models/book");
      await Book.syncIndexes(); // creates text & createdAt indexes in prod if missing
      cached.indexesEnsured = true;
    } catch (e) {
      console.error("syncIndexes(Book) failed:", e);
    }
  }

  return cached.conn;
}
