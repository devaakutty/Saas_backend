import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";

// import authRoutes from "./routes/authRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import securityRoutes from "./routes/securityRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
// import teamRoutes from "./routes/teamRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();
/* ================= CONNECT TO DB ================= */
await connectDB();

const app = express();

/* ================= CORS FIX ================= */

const allowedOrigins = [
  "http://localhost:3000",
  "https://saas-billzfrontend.vercel.app",
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

/* ✅ IMPORTANT: Handle preflight properly */
app.options("*", cors());


/* ================= BODY PARSER (🔥 CRITICAL FIX) ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ REQUIRED

/* ================= COOKIE PARSER ================= */
app.use(cookieParser());

/* ================= ROUTES ================= */
// app.use("/api/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/products", productRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/payments", paymentRoutes);
// app.use("/api/team", teamRoutes);
app.use("/api/account", accountRoutes);

/* ================= HEALTH CHECK ================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.json({
    status: "Backend running 🚀..Go",
  });
});

/* ================= ERROR HANDLER ================= */
app.use(errorHandler);

export default app;
