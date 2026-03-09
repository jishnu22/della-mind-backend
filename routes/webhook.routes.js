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

      // ✅ HANDLE BOTH EVENTS (CRITICAL FIX)
      if (
        event.event === "payment.captured" ||
        event.event === "order.paid"
      ) {
        console.log("🔥 WEBHOOK EVENT:", event.event);

        const payment =
          event.payload?.payment?.entity ||
          event.payload?.order?.entity?.payments?.[0];

        if (!payment) {
          console.log("⚠️ No payment entity found");
          return res.status(200).json({ status: "ignored" });
        }

        console.log("🔥 PAYMENT ID FROM WEBHOOK:", payment.id);
        console.log("🔥 ORDER ID FROM WEBHOOK:", payment.order_id);
        console.log("🔥 PAYMENT STATUS:", payment.status);

        // ✅ UPSERT: Insert if not exists, Update if does (Race condition safe)
        const result = await pool.query(
          `
          INSERT INTO payments (email, payment_id, course_id, status)
          VALUES ($1, $2, $3, 'PAID')
          ON CONFLICT (payment_id) DO UPDATE SET status = 'PAID'
          `,
          [
            payment.email || "webhook@pending.com", // Fallback if email missing
            payment.id,
            "beginner-mentalism", // Current course ID
          ]
        );

        console.log("🔥 DB ROWS UPDATED/INSERTED:", result.rowCount);
      }

      res.status(200).json({ status: "ok" });
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).send("Webhook error");
    }
  }
);

export default router;
