// src/models/user.ts
import { Schema, models, model, InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, required: true, index: true },
    username: { type: String, required: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema>;
export default models.User || model("User", UserSchema);
