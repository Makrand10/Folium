// src/models/book.ts
import { Schema, model, models, InferSchemaType, Types } from "mongoose";

const BookSchema = new Schema(
  {
    title: { type: String, required: true },
    author: { type: String },
    description: { type: String, default: "" }, // ✅ new
    fileId: { type: Schema.Types.ObjectId, required: true }, // GridFS _id
    coverUrl: { type: String },
    coverFileId: { type: Schema.Types.ObjectId },
    ownerId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true }
);

// Text index for search (include description)
BookSchema.index({ title: "text", author: "text", description: "text" });

export type BookDoc = InferSchemaType<typeof BookSchema> & { _id: Types.ObjectId };

export default models.Book || model("Book", BookSchema);
