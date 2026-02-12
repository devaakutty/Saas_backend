import express from "express";
import {
  getSalesReport,
  profitLossReport,
  gstReport,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ================= SALES REPORT ================= */
router.get("/sales", protect, getSalesReport);

/* ================= PROFIT & LOSS REPORT ================= */
router.get("/profit-loss", protect, profitLossReport);

/* ================= GST REPORT ================= */
router.get("/gst", protect, gstReport);

export default router;
