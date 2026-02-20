import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  markInvoiceAsPaid,
  downloadInvoicePdf,
  getLastFiveInvoices
} from "../controllers/invoiceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createInvoice);
router.get("/", protect, getInvoices);

// ✅ IMPORTANT — PUT THIS BEFORE "/:id"
router.get("/recent", protect, getLastFiveInvoices);

router.get("/:id/pdf", protect, downloadInvoicePdf);
router.get("/:id/pay", protect, markInvoiceAsPaid);
router.get("/:id", protect, getInvoiceById);
router.put("/:id", protect, updateInvoice);
router.delete("/:id", protect, deleteInvoice);

export default router;