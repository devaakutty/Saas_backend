import express from "express";
import {
  getMe,
  verifyPayment,
  createPayment,
  getPaymentByInvoice,
  deletePayment,
} from "../controllers/paymentController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   USER INFO (after login / payment)
===================================================== */

// GET /api/payments/me
router.get("/me", protect, getMe);

/* =====================================================
   PLAN PAYMENT VERIFY (NO PROTECT)
   Used right after register
===================================================== */

// POST /api/payments/verify
router.post("/verify", verifyPayment);

/* =====================================================
   INVOICE PAYMENTS (Protected)
===================================================== */

// POST /api/payments
router.post("/", protect, createPayment);

// GET /api/payments/:invoiceId
router.get("/:invoiceId", protect, getPaymentByInvoice);

// DELETE /api/payments/:id
router.delete("/:id", protect, deletePayment);

export default router;
