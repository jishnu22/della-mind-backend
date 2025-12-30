import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

router.post("/check-payment", async (req, res) => {
  const { email } = req.body;

  const result = await pool.query(
    `SELECT 1 FROM payments
     WHERE email=$1 AND status='PAID'`,
    [email]
  );

  res.json({
    hasPaid: result.rowCount > 0
  });
});

export default router;
