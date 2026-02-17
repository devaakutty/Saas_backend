import express from "express";
import {
  upgradePlan,
  getAccountUsage,
  updateInvoiceSettings,
} from "../controllers/accountController.js";

import { protect } from "../middleware/authMiddleware.js";
import { ownerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   UPGRADE PLAN (OWNER ONLY)
   PUT /api/account/upgrade
===================================================== */
router.put(
  "/upgrade",
  protect,
  ownerOnly,
  upgradePlan
);

/* =====================================================
   GET ACCOUNT USAGE
   GET /api/account/usage
===================================================== */
router.get(
  "/usage",
  protect,
  getAccountUsage
);

/* =====================================================
   UPDATE INVOICE SETTINGS (PRO & BUSINESS ONLY)
   PUT /api/account/invoice-settings
===================================================== */
router.put(
  "/invoice-settings",
  protect,
  ownerOnly,
  updateInvoiceSettings
);

export default router;
