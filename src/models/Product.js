import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true, // 🔥 improves dashboard queries
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    rate: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      default: "pcs",
    },

    stock: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
