import express from "express";
import {
  changePassword,
  deleteAccount,
} from "../controllers/securityController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ================= SECURITY ================= */
router.put("/change-password", protect, changePassword);
router.delete("/delete-account", protect, deleteAccount);

export default router;
