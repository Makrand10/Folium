// src/app/api/dev/add-demo-book/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Book from "@/models/book";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function POST() {
  try {
    await dbConnect();
    
    // Create a demo book
    const demoBook = await Book.create({
      title: "Sample Book",
      author: "Demo Author",
      coverUrl: null,
      fileId: new mongoose.Types.ObjectId(),
      ownerId: null,
      tags: ["demo", "sample"],
      meta: {}
    });

    return NextResponse.json({ 
      success: true, 
      book: demoBook,
      message: "Demo book created successfully" 
    });
  } catch (error) {
    console.error("Error creating demo book:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create demo book" 
    }, { status: 500 });
  }
}
