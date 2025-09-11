import { Schema, model, models, InferSchemaType } from "mongoose";

const ReadingProgressSchema = new Schema(
  {
    userKey:    { type: String, required: true, index: true },  // guestId or real user id
    bookId:     { type: Schema.Types.ObjectId, ref: "Book", required: true },
    cfi:        { type: String },
    percentage: { type: Number },
  },
  { timestamps: true }
);

// one doc per (userKey, bookId)
ReadingProgressSchema.index({ userKey: 1, bookId: 1 }, { unique: true });

// 👇 export the doc type for typed `lean()`
export type ReadingProgressDoc = InferSchemaType<typeof ReadingProgressSchema>;
export default models.ReadingProgress || model("ReadingProgress", ReadingProgressSchema);
