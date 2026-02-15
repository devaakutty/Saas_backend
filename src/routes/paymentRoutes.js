import express from "express";
import {
  verifyPayment,
  createPayment,
  getPaymentByInvoice,
  deletePayment,
} from "../controllers/paymentController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   PLAN PAYMENT (NO LOGIN REQUIRED)
   Used after Register for Pro/Business
===================================================== */

// POST /api/payments/verify
router.post("/verify", verifyPayment);

/* =====================================================
   INVOICE PAYMENTS (LOGIN REQUIRED)
===================================================== */

// POST /api/payments
router.post("/", protect, createPayment);

// GET /api/payments/:invoiceId
router.get("/:invoiceId", protect, getPaymentByInvoice);

// DELETE /api/payments/:id
router.delete("/:id", protect, deletePayment);

export default router;
