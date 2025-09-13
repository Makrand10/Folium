// src/models/book.ts
import { Schema, model, models, InferSchemaType, Types } from "mongoose";

const BookSchema = new Schema(
  {
    title: { type: String, required: true },
    author: { type: String },
    fileId: { type: Schema.Types.ObjectId, required: true }, // GridFS _id
    coverUrl: { type: String }, // Add this field for cover image
    coverFileId: { type: Schema.Types.ObjectId }, // Optional: store cover in GridFS
    ownerId: { type: Schema.Types.ObjectId, required: true, ref: "User" }, // Add this line
  },
  { timestamps: true }
);

// Create text index for search
BookSchema.index({ title: "text", author: "text" });

export type BookDoc = InferSchemaType<typeof BookSchema> & { _id: Types.ObjectId };

export default models.Book || model("Book", BookSchema);