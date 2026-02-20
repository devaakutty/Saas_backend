import User from "../models/User.js";
import Account from "../models/Account.js";
import { PLAN_CONFIG } from "../planConfig.js";
import bcrypt from "bcryptjs";

/* =====================================================
   🔥 HELPER: BUILD USER RESPONSE
===================================================== */
const buildUserResponse = (user) => {
  const planKey = user.accountId?.plan || "starter";
  const plan = PLAN_CONFIG[planKey];

  return {
    id: user._id,
    email: user.email,
    role: user.role,
    plan: planKey,
    isPaymentVerified:
    user.accountId?.isPaymentVerified ?? planKey === "starter",
    
    userLimit: plan?.userLimit || 1,
    invoiceLimit: plan?.invoiceLimit || 5,

    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    company: user.company,
    website: user.website,
    gstNumber: user.gstNumber,
    address: user.address,
    country: user.country,
    state: user.state,
    city: user.city,
    zip: user.zip,

    // 🔥🔥🔥 ADD THESE (VERY IMPORTANT)
    invoicePrefix: user.accountId?.invoicePrefix || "INV",
    upiId: user.accountId?.upiId || "",
    upiQrImage: user.accountId?.upiQrImage || "",
  };
};

/* =====================================================
   ADD TEAM MEMBER (OWNER ONLY)
===================================================== */
export const addTeamMember = async (req, res) => {
  try {
    const { role, accountId } = req.user;
    const { firstName, lastName, email, password } = req.body;

    if (role !== "owner") {
      return res.status(403).json({
        message: "Only account owner can add users",
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    const plan = PLAN_CONFIG[account.plan];
    if (!plan) {
      return res.status(400).json({
        message: "Invalid plan configuration",
      });
    }

    /* ===== USER LIMIT CHECK ===== */
    const usersCount = await User.countDocuments({ accountId });

    if (usersCount >= plan.userLimit) {
      return res.status(403).json({
        message: `User limit reached (${plan.userLimit}). Upgrade your plan.`,
      });
    }

    /* ===== CHECK EXISTING ===== */
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
      accountId,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    /* ===== CREATE MEMBER ===== */
    const hashedPassword = await bcrypt.hash(password, 10);

    const member = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: firstName || "",
      lastName: lastName || "",
      role: "member",
      accountId,
    });

    res.status(201).json({
      message: "Team member added successfully",
      member: {
        id: member._id,
        email: member.email,
        role: member.role,
      },
    });

  } catch (error) {
    console.error("ADD TEAM MEMBER ERROR:", error);
    res.status(500).json({
      message: "Failed to add team member",
    });
  }
};

/* =====================================================
   GET LOGGED-IN USER
===================================================== */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("accountId")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(buildUserResponse(user));

  } catch (err) {
    console.error("GET ME ERROR:", err);
    res.status(500).json({
      message: "Failed to fetch user",
    });
  }
};

/* =====================================================
   UPDATE PROFILE
===================================================== */
export const updateMe = async (req, res) => {
  try {
    // Prevent protected fields
    delete req.body.role;
    delete req.body.accountId;
    delete req.body.password;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("accountId")
      .select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(buildUserResponse(updatedUser));

  } catch (error) {
    console.error("UPDATE ME ERROR:", error);
    res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

/* =====================================================
   DELETE ACCOUNT
===================================================== */
export const deleteMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role === "owner") {
      await User.deleteMany({ accountId: user.accountId });
      await Account.findByIdAndDelete(user.accountId);
    } else {
      await user.deleteOne();
    }

    res.clearCookie("token");

    res.json({
      message: "Account deleted successfully",
    });

  } catch (error) {
    console.error("DELETE ME ERROR:", error);
    res.status(500).json({
      message: "Failed to delete account",
    });
  }
};

/* =====================================================
   GET TEAM MEMBERS
===================================================== */
export const getTeamMembers = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only account owner can view team members",
      });
    }

    const users = await User.find({
      accountId: req.user.accountId,
    })
      .select("_id email firstName lastName role createdAt")
      .sort({ createdAt: 1 });

    res.json({
      count: users.length,
      users,
    });

  } catch (err) {
    console.error("GET TEAM MEMBERS ERROR:", err);
    res.status(500).json({
      message: "Failed to fetch team members",
    });
  }
};

/* =====================================================
   REMOVE TEAM MEMBER
===================================================== */
export const removeTeamMember = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only account owner can remove users",
      });
    }

    if (req.user.id === req.params.userId) {
      return res.status(400).json({
        message: "Owner cannot remove themselves",
      });
    }

    const member = await User.findOne({
      _id: req.params.userId,
      accountId: req.user.accountId,
    });

    if (!member) {
      return res.status(404).json({
        message: "User not found in this account",
      });
    }

    await member.deleteOne();

    res.json({
      message: "Team member removed successfully",
    });

  } catch (error) {
    console.error("REMOVE TEAM MEMBER ERROR:", error);
    res.status(500).json({
      message: "Failed to remove team member",
    });
  }
};
