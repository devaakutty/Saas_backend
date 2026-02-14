import jwt from "jsonwebtoken";
import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";
import Account from "../models/Account.js";
import User from "../models/User.js";
import { PLAN_CONFIG } from "../planConfig.js";

/* ================= TOKEN GENERATOR ================= */

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

/* =====================================================
   VERIFY PAYMENT (PLAN UPGRADE)
===================================================== */
  export const verifyPayment = async (req, res) => {
    try {
      const { email, plan } = req.body;

      if (!email || !plan) {
        return res.status(400).json({
          message: "Email and plan are required",
        });
      }

      if (!PLAN_CONFIG[plan]) {
        return res.status(400).json({
          message: "Invalid plan",
        });
      }

      // 🔍 Find user manually (NOT using req.user)
      const user = await User.findOne({ email }).populate("accountId");

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const account = await Account.findById(user.accountId);

      if (!account) {
        return res.status(404).json({
          message: "Account not found",
        });
      }

      /* ================= UPDATE PLAN ================= */

      account.plan = plan;
      account.userLimit = PLAN_CONFIG[plan].userLimit;
      account.updatedAt = new Date();

      await account.save();

      /* ================= LOGIN USER ================= */

      const token = generateToken(user._id);

      // const isProduction = process.env.NODE_ENV === "production";

      const isProduction = process.env.NODE_ENV === "production";

      const cookieOptions = {
        httpOnly: true,
        secure: isProduction, // false on localhost
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
      };

      res.cookie("token", token, cookieOptions);

      res.json({
        message: "Payment successful",
        plan: account.plan,
        userLimit: account.userLimit,
      });

    } catch (error) {
      console.error("VERIFY PAYMENT ERROR:", error);

      res.status(500).json({
        message: "Payment verification failed",
      });
    }
  };

/* =====================================================
   CREATE PAYMENT
===================================================== */
export const createPayment = async (req, res) => {
  try {
    const user = req.user;

    const { invoiceId, method, provider, amount } = req.body;

    if (!invoiceId || !method || amount === undefined) {
      return res.status(400).json({
        message: "invoiceId, method, and amount are required",
      });
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      accountId: user.accountId,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const existingPayment = await Payment.findOne({ invoiceId });
    if (existingPayment) {
      return res.status(400).json({
        message: "Payment already exists for this invoice",
      });
    }

    const payment = await Payment.create({
      invoiceId,
      accountId: user.accountId,
      createdBy: user.id,
      method,
      provider,
      amount: Number(amount),
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({ message: "Failed to create payment" });
  }
};

/* =====================================================
   GET PAYMENT BY INVOICE
===================================================== */
export const getPaymentByInvoice = async (req, res) => {
  try {
    const user = req.user;

    const payment = await Payment.findOne({
      invoiceId: req.params.invoiceId,
      accountId: user.accountId,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({ message: "Failed to fetch payment" });
  }
};

/* =====================================================
   DELETE PAYMENT
===================================================== */
export const deletePayment = async (req, res) => {
  try {
    const user = req.user;

    const payment = await Payment.findOne({
      _id: req.params.id,
      accountId: user.accountId,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    await payment.deleteOne();

    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Delete payment error:", error);
    res.status(500).json({ message: "Failed to delete payment" });
  }
};
