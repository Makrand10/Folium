import { Schema, model, models, InferSchemaType, Types } from "mongoose";

const BookSchema = new Schema(
  {
    title:  { type: String, required: true },
    author: { type: String },
    fileId: { type: Schema.Types.ObjectId, required: true }, // GridFS _id
  },
  { timestamps: true }
);

// 👇 include _id so TS knows it's there on lean() results
export type BookDoc = InferSchemaType<typeof BookSchema> & { _id: Types.ObjectId };

export default models.Book || model("Book", BookSchema);
