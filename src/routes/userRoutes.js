import express from "express";
import {
  getMe,
  updateMe,
  deleteMe,
  addTeamMember,
  getTeamMembers,
  removeTeamMember,
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ================= PROFILE ================= */

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.delete("/me", protect, deleteMe);

/* ================= TEAM MANAGEMENT ================= */

router.post("/team-members", protect, addTeamMember);
router.get("/team", protect, getTeamMembers);
router.delete("/team/:userId", protect, removeTeamMember);

export default router;
