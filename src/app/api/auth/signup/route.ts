// src/app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/user";
import { hash } from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { email, username, password } = await req.json().catch(() => ({}));
  if (!email || !username || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  await dbConnect();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return NextResponse.json({ error: "Email already used" }, { status: 409 });

  const passwordHash = await hash(password, 12);
  const doc = await User.create({ email: email.toLowerCase(), username, passwordHash });

  return NextResponse.json({ ok: true, userId: String(doc._id) });
}
