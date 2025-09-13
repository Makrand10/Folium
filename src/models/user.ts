// src/models/user.ts
import { Schema, models, model, InferSchemaType, Types } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, required: true, index: true },
    username: { type: String, required: true },
    passwordHash: { type: String, required: true },
    bookIds: [{ type: Schema.Types.ObjectId, ref: "Book" }], // Add this line
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: Types.ObjectId };
export default models.User || model("User", UserSchema);