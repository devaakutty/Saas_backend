import express from "express";
import {
  register,
  login,
  logout,
} from "../controllers/authController.js";

const router = express.Router();

/* ================= AUTH ROUTES ================= */

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/logout
router.post("/logout", logout);

export default router;
