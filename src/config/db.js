import mongoose from "mongoose";
import { setServers } from "node:dns/promises";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    // ✅ Force reliable DNS (Vercel + Atlas fix)
    await setServers(["1.1.1.1", "8.8.8.8"]);

    // ✅ Disable mongoose buffering (prevents 10s hang)
    mongoose.set("bufferCommands", false);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // fail fast
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      family: 4, // 🔥 VERY IMPORTANT for Vercel
    });

    console.log("✅ MongoDB connected:", conn.connection.host);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error; // ❗ do NOT process.exit() on Vercel
  }
};

export default connectDB;
