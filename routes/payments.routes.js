import express from "express";
import { razorpay } from "../config/razorpay.js";
import { verifySignature } from "../utils/razorpayVerify.js";
import { pool } from "../config/db.js";

const router = express.Router();

router.post("/create-order", async (_, res) => {
  const order = await razorpay.orders.create({
    amount: 380 * 100,
    currency: "INR"
  });

  res.json({
    order_id: order.id,
    amount: 380
  });
});

router.post("/verify", async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    email
  } = req.body;

  const valid = verifySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!valid) {
    return res.status(401).json({ status: "FAILED" });
  }

  // ✅ UPSERT: Insert if not exists, Update if does (Race condition safe)
  await pool.query(
    `INSERT INTO payments (email, payment_id, course_id, status)
     VALUES ($1, $2, $3, 'PAID')
     ON CONFLICT (payment_id) DO UPDATE SET status = 'PAID'`,
    [email, razorpay_payment_id, "beginner-mentalism"]
  );

  res.json({ status: "PROCESSING" });
});

router.post("/manual-add", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Generate a unique payment ID for manual addition
  const customId = `newaddition2026${Date.now()}${Math.floor(Math.random() * 1000)}`;

  try {
    // Check if user already has access
    const existing = await pool.query(
      "SELECT 1 FROM payments WHERE email = $1 AND status = 'PAID'",
      [email]
    );

    if (existing.rowCount > 0) {
      return res.status(200).json({ message: "User already has access", skipped: true });
    }

    // Insert new manual payment
    await pool.query(
      `INSERT INTO payments (email, payment_id, course_id, status)
       VALUES ($1, $2, $3, 'PAID')
       ON CONFLICT (payment_id) DO NOTHING`,
      [email, customId, "beginner-mentalism"]
    );

    res.json({ status: "SUCCESS", payment_id: customId });
  } catch (err) {
    console.error("Manual add error:", err);
    res.status(500).json({ error: "Failed to add student" });
  }
});

export default router;
