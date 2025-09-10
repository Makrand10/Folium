import { Schema, models, model, InferSchemaType } from "mongoose";

const LastRead = new Schema({
  bookId: { type: Schema.Types.ObjectId, ref: "Book" },
  cfi: String,
  percentage: Number,
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const UserSchema = new Schema({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  library: [{ type: Schema.Types.ObjectId, ref: "Book" }],
  lastRead: LastRead,
}, { timestamps: true });

export type User = InferSchemaType<typeof UserSchema>;
export default models.User || model("User", UserSchema);
