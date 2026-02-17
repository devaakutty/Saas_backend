import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Account from "../models/Account.js";

/* ================= GENERATE TOKEN ================= */

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined");
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

/* ================= COOKIE OPTIONS ================= */

// 🔥 Use function instead of constant (safer for clearCookie)
// const getCookieOptions = () => ({
//   httpOnly: true,
//   secure: true,           // Required for HTTPS (Render)
//   sameSite: "none",       // Required for cross-domain (Vercel ↔ Render)
//   path: "/",
//   maxAge: 24 * 60 * 60 * 1000,
// });


const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProd, // 🔥 only true in production
    sameSite: isProd ? "none" : "lax", // 🔥 important
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  };
};

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  try {
    const { name, email, mobile, password, plan } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { mobile }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email or mobile already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const selectedPlan =
      plan === "pro" || plan === "business" ? plan : "starter";

    const userLimit =
      selectedPlan === "starter" ? 1 :
      selectedPlan === "pro" ? 5 : 10;

    const user = await User.create({
      name,
      email: normalizedEmail,
      mobile,
      password: hashedPassword,
      role: "owner",
    });

    const account = await Account.create({
      ownerId: user._id,
      plan: selectedPlan,
      userLimit,
      isPaymentVerified: selectedPlan === "starter",
    });

    user.accountId = account._id;
    await user.save();

    return res.status(201).json({
      message: "Registered successfully",
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Registration failed" });
  }
};
/* ================= LOGIN ================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 🔥 If your password has select:false in schema, use .select("+password")
    const user = await User.findOne({
      email: normalizedEmail,
    })
      .select("+password") // safe even if not needed
      .populate("accountId");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, getCookieOptions());

    const account = user.accountId;

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,

        // 🔥 Premium Settings (important for Payment page)
        plan: account?.plan || "starter",
        invoicePrefix: account?.invoicePrefix || "INV",
        upiId: account?.upiId || "",
        upiQrImage: account?.upiQrImage || "",

        subscriptionEnd: account?.subscriptionEnd || null,
        isPaymentVerified: account?.isPaymentVerified || false,
      },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      message: "Login failed",
    });
  }
};
/* ================= LOGOUT ================= */
export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });

  res.json({ message: "Logged out successfully" });
};
