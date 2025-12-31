import express from "express";
import crypto from "crypto";
import { pool } from "../config/db.js";

const router = express.Router();

/**
 * Razorpay Webhook
 * IMPORTANT: uses express.raw()
 */
router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("🔥 RAZORPAY WEBHOOK HIT");
    try {
      const razorpaySignature = req.headers["x-razorpay-signature"];

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(req.body)
        .digest("hex");

      // ❌ Signature mismatch → reject
      if (razorpaySignature !== expectedSignature) {
        return res.status(400).send("Invalid webhook signature");
      }

      const event = JSON.parse(req.body.toString());

      // ✅ FINAL PAYMENT CONFIRMATION
      if (event.event === "payment.captured") {
        const payment = event.payload.payment.entity;

        await pool.query(
          `
          UPDATE payments
          SET status = 'PAID'
          WHERE payment_id = $1
          `,
          [payment.id]
        );

        // 🔓 FINAL place to unlock course access
      }

      res.status(200).json({ status: "ok" });
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).send("Webhook error");
    }
  }
);

export default router;
