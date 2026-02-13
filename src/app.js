import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import securityRoutes from "./routes/securityRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";

import { errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

/* ================== SAFE DB CONNECTION (SERVERLESS READY) ================== */

let isConnected = false;

const connectDatabase = async () => {
  if (isConnected) return;

  try {
    await connectDB();
    isConnected = true;
    console.log("MongoDB Connected ✅");
  } catch (error) {
    console.error("DB Connection Failed ❌", error);
    throw error;
  }
};

// Connect DB before handling routes
app.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

/* ================== CORS ================== */

const allowedOrigins = [
    "https://saas-frontend-trytwo.vercel.app",
    "http://localhost:3000"
  // "https://saas-billzfrontend.vercel.app",

];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* ================== BODY PARSER ================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================== COOKIE PARSER ================== */
app.use(cookieParser());

/* ================== ROUTES ================== */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/products", productRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/account", accountRoutes);

/* ================== HEALTH CHECK ================== */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ================== ROOT ================== */
app.get("/", (req, res) => {
  res.json({
    status: "Backend running 🚀 go ",
  });
});

/* ================== ERROR HANDLER ================== */
app.use(errorHandler);

export default app;
