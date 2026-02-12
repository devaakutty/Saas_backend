import jwt from "jsonwebtoken";
import User from "../models/User.js";

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
      console.error("JWT_SECRET missing");
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
      .select("_id role accountId");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    /* 🔥 IMPORTANT FIX */
    req.user = {
      id: user._id.toString(),     // ✅ convert ObjectId → string
      role: user.role,
      accountId: user.accountId?.toString(),
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
