import express from "express";
import { upgradePlan,getAccountUsage  } from "../controllers/accountController.js";
import { protect, ownerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Upgrade subscription plan
router.post("/upgrade", protect, ownerOnly, upgradePlan);
router.get("/usage", protect, getAccountUsage);

export default router;
