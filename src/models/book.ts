import { Schema, models, model, InferSchemaType } from "mongoose";

const BookSchema = new Schema({
  title: { type: String, required: true },
  author: { type: String, default: "Unknown", index: true },
  coverUrl: String,
  fileId: { type: Schema.Types.ObjectId, required: true }, // GridFS file _id
  ownerId: { type: Schema.Types.ObjectId, ref: "User" },
  tags: [String],
  meta: Schema.Types.Mixed
}, { timestamps: true });

BookSchema.index({ title: "text", author: "text", tags: "text" });

// 👇 rename the exported type so it doesn't collide with the default export name
export type BookDoc = InferSchemaType<typeof BookSchema>;
export default models.Book || model("Book", BookSchema);
