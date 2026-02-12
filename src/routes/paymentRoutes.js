import express from "express";
import {
  createPayment,
  getPaymentByInvoice,
  deletePayment,
  verifyPayment
} from "../controllers/paymentController.js";
import { protect, ownerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createPayment);
router.get("/invoice/:invoiceId", protect, getPaymentByInvoice);
router.delete("/:id", protect, deletePayment);
router.post("/verify", protect, ownerOnly, verifyPayment);

export default router;
