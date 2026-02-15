import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Account from "../models/Account.js";

/* ================= AUTH PROTECT ================= */
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Not authorized, please login",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing in environment");
      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    const user = await User.findById(decoded.id)
      .select("_id email role accountId")
      .populate("accountId");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    const account = user.accountId;

    if (!account) {
      return res.status(401).json({
        message: "Account not found",
      });
    }

    /* ================= SUBSCRIPTION CHECK ================= */

    let isPaymentVerified =
      account.isPaymentVerified ?? false;

    // 🔥 Auto-expire subscription
    if (
      account.plan !== "starter" &&
      account.subscriptionEnd &&
      new Date() > new Date(account.subscriptionEnd)
    ) {
      account.isPaymentVerified = false;
      await account.save();
      isPaymentVerified = false;
    }

    /* ================= ATTACH USER ================= */

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      accountId: account._id.toString(),
      plan: account.plan || "starter",
      isPaymentVerified,
      subscriptionEnd: account.subscriptionEnd || null,
    };

    next();

  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error);
    return res.status(401).json({
      message: "Authentication failed",
    });
  }
};

/* ================= OWNER ONLY ================= */
export const ownerOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "owner") {
    return res.status(403).json({
      message: "Only account owner can perform this action",
    });
  }

  next();
};
