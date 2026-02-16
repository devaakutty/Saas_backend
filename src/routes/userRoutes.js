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

// Get logged-in user
router.get("/me", protect, getMe);

// Update profile
router.put("/me", protect, updateMe);

// Delete account
router.delete("/me", protect, deleteMe);

// Add team member
router.post("/team-members", protect, addTeamMember);

// Get all team members
router.get("/team", protect, getTeamMembers);

// Remove team member
router.delete("/team/:userId", protect, removeTeamMember);

export default router;
