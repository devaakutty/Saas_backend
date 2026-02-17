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
      default: 1,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    /* ================= PREMIUM SETTINGS ================= */

    invoicePrefix: {
      type: String,
      default: "INV", // Starter default
    },

    upiId: {
      type: String,
      default: "",
    },
      upiQrImage: {
       type: String, // store image URL or base64
       default: "",
     },


    subscriptionEnd: {
      type: Date,
    },

    isPaymentVerified: {
      type: Boolean,
      default: false,
    },

  },
  { timestamps: true }
);

export default mongoose.model("Account", accountSchema);
