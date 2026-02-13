import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Account from "../models/Account.js";

/* =====================================================
   HELPER: GENERATE JWT
===================================================== */

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined");
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

/* =====================================================
   HELPER: COOKIE OPTIONS (PRODUCTION SAFE)
===================================================== */

  // const isProduction = process.env.NODE_ENV === "production";
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,              // secure only in production
    sameSite: isProduction ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
  };


/* =====================================================
   REGISTER
===================================================== */

export const register = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 🔍 Check duplicates (email OR mobile)
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { mobile }
      ],
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(400).json({
          message: "Email already registered",
        });
      }

      if (existingUser.mobile === mobile) {
        return res.status(400).json({
          message: "Mobile number already registered",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      mobile,
      password: hashedPassword,
      role: "owner",
    });

    const account = await Account.create({
      ownerId: user._id,
      plan: "starter",
      userLimit: 1,
    });

    user.accountId = account._id;
    await user.save();

    const token = generateToken(user._id);

    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      message: "Registered successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        plan: account.plan,
      },
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return res.status(500).json({
      message: "Registration failed",
    });
  }
};
/* =====================================================
   LOGIN
===================================================== */

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).populate("accountId");

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

    // 🔥 SET AUTH COOKIE
    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        plan: user.accountId?.plan,
      },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      message: "Login failed",
    });
  }
};

/* =====================================================
   LOGOUT
===================================================== */

export const logout = (req, res) => {
  res.clearCookie("token", cookieOptions);

  res.json({
    message: "Logged out successfully",
  });
};
