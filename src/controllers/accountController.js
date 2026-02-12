import Account from "../models/Account.js";

/* ================= UPGRADE PLAN (OWNER ONLY) ================= */
export const upgradePlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const owner = req.user;

    if (owner.role !== "owner") {
      return res.status(403).json({
        message: "Only account owner can upgrade plan",
      });
    }

    if (!["starter", "pro", "business"].includes(plan)) {
      return res.status(400).json({
        message: "Invalid plan",
      });
    }

    const account = await Account.findById(owner.accountId);

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    // 🔢 Define limits
    let userLimit = 1;

    if (plan === "pro") userLimit = 5;
    if (plan === "business") userLimit = 10;

    account.plan = plan;
    account.userLimit = userLimit;

    await account.save();

    res.json({
      message: "Plan upgraded successfully",
      plan: account.plan,
      userLimit: account.userLimit,
    });
  } catch (error) {
    console.error("UPGRADE PLAN ERROR:", error);
    res.status(500).json({
      message: "Failed to upgrade plan",
    });
  }
};


/* ================= GET ACCOUNT USAGE ================= */
export const getAccountUsage = async (req, res) => {
  try {
    const account = await Account.findById(req.user.accountId);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const usersUsed = await User.countDocuments({
      accountId: account._id,
    });

    res.json({
      plan: account.plan,
      userLimit: account.userLimit,
      usersUsed,
      usersRemaining: Math.max(
        account.userLimit - usersUsed,
        0
      ),
    });
  } catch (err) {
    console.error("GET ACCOUNT USAGE ERROR:", err);
    res.status(500).json({ message: "Failed to fetch usage" });
  }
};
