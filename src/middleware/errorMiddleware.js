/* ================= GLOBAL ERROR HANDLER ================= */
export const errorHandler = (err, req, res, next) => {
  // 🔥 Always log error message (safe)
  console.error("❌ Error:", err.message);

  let statusCode = res.statusCode && res.statusCode !== 200
    ? res.statusCode
    : 500;

  let message = err.message || "Internal Server Error";

  /* ================= MONGOOSE CAST ERROR ================= */
  // Invalid ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  /* ================= DUPLICATE KEY ERROR ================= */
  // Example: duplicate email
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = field
      ? `${field} already exists`
      : "Duplicate field value";
  }

  /* ================= VALIDATION ERROR ================= */
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};
