import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    plan: {
      type: String,
      enum: ["starter", "pro", "business"],
      default: "starter",
    },

    userLimit: {
      type: Number,
      default: 1, // starter
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Account", accountSchema);
