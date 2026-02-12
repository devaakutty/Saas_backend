import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // 🔐 Auth
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },

    // 👤 Profile
    firstName: String,
    lastName: String,
    phone: String,
    company: String,
    website: String,
    gstNumber: String,
    address: String,
    country: String,
    state: String,
    city: String,
    zip: String,

    // 🧠 SaaS fields (NEW)
    role: {
      type: String,
      enum: ["owner", "member"],
      default: "owner", // first registered user
    },

    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
