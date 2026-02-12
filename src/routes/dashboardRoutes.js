import express from "express";
import {
  getDashboardSummary,
  getStockSummary,
  getDevices,
  getLowStockItems,
} from "../controllers/dashboardController.js";

import { protect } from "../middleware/authMiddleware.js";
import { requireFeature } from "../middleware/featureMiddleware.js";

const router = express.Router();

/* ================= DASHBOARD ================= */

// Basic dashboard (all plans)
router.get("/summary", protect, getDashboardSummary);

// Stock summary (all plans)
router.get("/stock", protect, getStockSummary);

// Devices (Pro+ only)
router.get(
  "/devices",
  protect,
  requireFeature("analytics"),
  getDevices
);

// Low stock (Pro+ only)
router.get(
  "/low-stock",
  protect,
  requireFeature("analytics"),
  getLowStockItems
);

export default router;
