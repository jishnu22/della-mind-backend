import express from "express";
import { razorpay } from "../config/razorpay.js";
import { verifySignature } from "../utils/razorpayVerify.js";
import { pool } from "../config/db.js";

const router = express.Router();

router.post("/create-order", async (_, res) => {
  const order = await razorpay.orders.create({
    amount: 350 * 100,
    currency: "INR"
  });

  res.json({
    order_id: order.id,
    amount: 350
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

  // ✅ INSERT AS PENDING (unchanged)
  await pool.query(
    `INSERT INTO payments (email, payment_id, course_id, status)
     VALUES ($1, $2, $3, 'PENDING')
     ON CONFLICT (payment_id) DO NOTHING`,
    [email, razorpay_payment_id, "beginner-mentalism"]
  );

  // 🔁 SAFETY SYNC (CRITICAL FIX)
  // Webhook may have already fired before this insert
  await pool.query(
    `UPDATE payments
     SET status = 'PAID'
     WHERE payment_id = $1`,
    [razorpay_payment_id]
  );

  res.json({ status: "PROCESSING" });
});

export default router;
