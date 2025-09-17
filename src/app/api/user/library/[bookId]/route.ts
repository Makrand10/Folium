import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { dbConnect } from "@/lib/db";
import User from "@/models/user";
import { Types } from "mongoose";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ bookId: string }> }
) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await ctx.params;
  if (!bookId) return NextResponse.json({ error: "Missing bookId" }, { status: 400 });

  await dbConnect();

  try {
    const bookObjectId = new Types.ObjectId(bookId);
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $pull: { bookIds: bookObjectId } },
      { new: true }
    );

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(
      { success: true, message: "Book removed from library" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing book from library:", error);
    return NextResponse.json({ error: "Failed to remove book" }, { status: 500 });
  }
}
