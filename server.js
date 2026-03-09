import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./config/db.js";

import payments from "./routes/payments.routes.js";
import auth from "./routes/auth.routes.js";
import course from "./routes/course.routes.js";
import videos from "./routes/videos.routes.js";
import webhook from "./routes/webhook.routes.js";

dotenv.config();

const app = express();

// 🛠️ AUTO-REPAIR SEQUENCE (FIXES DUPLICATE KEY ERRORS)
async function syncSequence() {
  try {
    await pool.query("SELECT setval(pg_get_serial_sequence('payments', 'id'), coalesce(max(id), 0) + 1, false) FROM payments");
    console.log("✅ DATABASE SEQUENCE SYNCED");
  } catch (err) {
    console.error("❌ SEQUENCE SYNC FAILED:", err.message);
  }
}
syncSequence();

/* ✅ RENDER-SAFE CORS CONFIG */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin.startsWith("http://localhost")) return callback(null, true);
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// 🔥 Razorpay webhook FIRST (RAW body)
app.use("/api/webhooks", webhook);

// ✅ JSON parsing AFTER webhook
app.use(express.json());

// Normal routes
app.use("/api/payments", payments);
app.use("/api/auth", auth);
app.use("/api/course", course);
app.use("/api/videos", videos);

app.get("/", (req, res) => {
  res.send("Backend running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
