// src/models/book.ts
import { Schema, model, models, InferSchemaType, Types } from "mongoose";

const BookSchema = new Schema(
  {
    title: { type: String, required: true },
    author: { type: String },
    description: { type: String, default: "" },
    fileId: { type: Schema.Types.ObjectId, required: true }, // GridFS _id
    coverUrl: { type: String },
    coverFileId: { type: Schema.Types.ObjectId },
    ownerId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true }
);

// ✅ Text index used by search
BookSchema.index({ title: "text", author: "text", description: "text" });

// ✅ Fast “latest” feed
BookSchema.index({ createdAt: -1 });

export type BookDoc = InferSchemaType<typeof BookSchema> & { _id: Types.ObjectId };

// Keep default export for `import Book from "@/models/book"`
export default (models.Book as any) || model("Book", BookSchema);
