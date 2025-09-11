import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/user";
import { Types } from "mongoose";

export async function GET() {
  await dbConnect();
  const username = "demo";

  const existing = await User.findOne({ username })
    .select("_id")
    .lean<{ _id: Types.ObjectId }>();

  if (existing) return NextResponse.json({ userId: existing._id.toString() });

  const created = await User.create({
    username,
    passwordHash: "dev", // temp for dev
    library: [],
    lastRead: undefined,
  });

  return NextResponse.json({ userId: created._id.toString() });
}
