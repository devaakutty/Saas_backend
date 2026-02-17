import Account from "../models/Account.js";
import User from "../models/User.js";

/* ================= UPGRADE PLAN (OWNER ONLY) ================= */
export const upgradePlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const owner = req.user;

    if (!owner || owner.role !== "owner") {
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

    /* ========= USER LIMIT ========= */
    let userLimit = 1;
    if (plan === "pro") userLimit = 5;
    if (plan === "business") userLimit = 10;

    /* ========= SUBSCRIPTION (30 DAYS) ========= */
    let subscriptionEnd = null;
    let isPaymentVerified = true;

    if (plan !== "starter") {
      subscriptionEnd = new Date();
      subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);
    } else {
      isPaymentVerified = true; // starter always free
    }

    /* ========= UPDATE ACCOUNT ========= */
    account.plan = plan;
    account.userLimit = userLimit;
    account.subscriptionEnd = subscriptionEnd;
    account.isPaymentVerified = isPaymentVerified;

    await account.save();

    res.json({
      message: "Plan upgraded successfully",
      plan: account.plan,
      userLimit: account.userLimit,
      subscriptionEnd: account.subscriptionEnd,
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

/* ================= UPDATE INVOICE SETTINGS ================= */

export const updateInvoiceSettings = async (req, res) => {
  try {
    const { invoicePrefix, upiId, upiQrImage } = req.body;

    const account = await Account.findById(req.user.accountId);

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    /* 🔒 STARTER PLAN RESTRICTION */
    if (account.plan === "starter") {
      return res.status(403).json({
        message: "Upgrade to Pro or Business to customize invoice settings",
      });
    }

    /* ================= VALIDATIONS ================= */

    // Invoice Prefix
    if (invoicePrefix !== undefined) {
      const cleanedPrefix = invoicePrefix.trim().toUpperCase();

      if (cleanedPrefix.length < 2 || cleanedPrefix.length > 10) {
        return res.status(400).json({
          message: "Invoice prefix must be 2–10 characters",
        });
      }

      account.invoicePrefix = cleanedPrefix;
    }

    // UPI ID
    if (upiId !== undefined) {
      account.upiId = upiId.trim();
    }

    // UPI QR IMAGE (Base64)
    if (upiQrImage !== undefined) {

      // 🔥 Optional: Protect DB from huge images
      const maxSize = 5 * 1024 * 1024; // 5MB approx

      if (upiQrImage.length > maxSize) {
        return res.status(400).json({
          message: "QR image size too large",
        });
      }

      account.upiQrImage = upiQrImage;
    }

    await account.save();

    return res.status(200).json({
      message: "Invoice settings updated successfully",
      invoicePrefix: account.invoicePrefix,
      upiId: account.upiId,
      upiQrImage: account.upiQrImage,
    });

  } catch (error) {
    console.error("INVOICE SETTINGS ERROR:", error);
    return res.status(500).json({
      message: "Failed to update invoice settings",
    });
  }
};
